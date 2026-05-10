using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;

using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Logistics;

public record ImportFleetRowInput(
    int RowNumber,
    string RegistrationNumber,
    FleetType Type,
    int Capacity,
    string? Description);

public record ImportFleetRowError(int RowNumber, string Error);

public record ImportFleetPreviewRow(
    int RowNumber,
    string RegistrationNumber,
    FleetType Type,
    int Capacity);

public record ImportFleetsPreviewResponse(
    string BatchReference,
    int TotalRows,
    int ValidRows,
    int InvalidRows,
    IReadOnlyList<ImportFleetPreviewRow> PreviewRows,
    IReadOnlyList<ImportFleetRowError> Errors,
    string? Message);

public record ImportFleetsConfirmResponse(
    string BatchId,
    int CreatedCount,
    int FailedCount,
    IReadOnlyList<int> FleetIds,
    IReadOnlyList<ImportFleetRowError> Errors,
    string? Message);

public record PreviewImportFleetsCommand(
    IReadOnlyList<ImportFleetRowInput> Rows) : IRequest<ImportFleetsPreviewResponse>;

public record ConfirmImportFleetsCommand(
    IReadOnlyList<ImportFleetRowInput> Rows,
    bool SkipInvalidRows = true) : IRequest<ImportFleetsConfirmResponse>;

public class ImportFleetsHandler(
    ICargoMintDbContext context,
    ITenantProvider tenantProvider)
    : IRequestHandler<PreviewImportFleetsCommand, ImportFleetsPreviewResponse>,
      IRequestHandler<ConfirmImportFleetsCommand, ImportFleetsConfirmResponse>
{
    private const int MaxRows = 10000;

    public async Task<ImportFleetsPreviewResponse> Handle(PreviewImportFleetsCommand request, CancellationToken cancellationToken)
    {
        var batchRef = GenerateBatchRef("FLEET-PREVIEW");
        var tenantError = await ValidateTenantAsync(cancellationToken);
        if (!string.IsNullOrWhiteSpace(tenantError))
        {
            return new ImportFleetsPreviewResponse(batchRef, request.Rows.Count, 0, request.Rows.Count, [], [], tenantError);
        }

        var validationResult = ValidateRows(request.Rows);
        var previewRows = validationResult.ValidRows
            .Select(x => new ImportFleetPreviewRow(x.RowNumber, x.RegistrationNumber.Trim().ToUpperInvariant(), x.Type, x.Capacity))
            .ToList();

        return new ImportFleetsPreviewResponse(
            batchRef,
            request.Rows.Count,
            validationResult.ValidRows.Count,
            validationResult.Errors.Count,
            previewRows,
            validationResult.Errors,
            validationResult.Errors.Count == 0 ? "Preview is valid and ready for import." : "Some rows contain validation errors.");
    }

    public async Task<ImportFleetsConfirmResponse> Handle(ConfirmImportFleetsCommand request, CancellationToken cancellationToken)
    {
        var batchId = GenerateBatchRef("FLEET-IMPORT");
        var tenantError = await ValidateTenantAsync(cancellationToken);
        if (!string.IsNullOrWhiteSpace(tenantError))
        {
            return new ImportFleetsConfirmResponse(batchId, 0, request.Rows.Count, [], [], tenantError);
        }

        var validationResult = ValidateRows(request.Rows);
        var rowsToImport = request.SkipInvalidRows ? validationResult.ValidRows : request.Rows;
        if (rowsToImport.Count == 0)
        {
            return new ImportFleetsConfirmResponse(batchId, 0, request.Rows.Count, [], validationResult.Errors, "No valid rows to process.");
        }

        var createdIds = new List<int>();
        foreach (var row in rowsToImport)
        {
            if (!request.SkipInvalidRows && validationResult.Errors.Any(x => x.RowNumber == row.RowNumber))
            {
                continue;
            }

            var fleet = new Fleet
            {
                RegistrationNumber = row.RegistrationNumber.Trim().ToUpperInvariant(),
                FleetType = row.Type,
                Capacity = row.Capacity,
                Description = string.IsNullOrWhiteSpace(row.Description) ? null : row.Description.Trim()
            };
            context.Fleets.Add(fleet);
            await context.SaveChangesAsync(cancellationToken);
            createdIds.Add(fleet.Id);
        }

        var failedCount = request.Rows.Count - createdIds.Count;
        return new ImportFleetsConfirmResponse(batchId, createdIds.Count, failedCount, createdIds, validationResult.Errors, "Fleet import completed.");
    }

    private async Task<string?> ValidateTenantAsync(CancellationToken cancellationToken)
    {
        if (!tenantProvider.TenantId.HasValue || tenantProvider.TenantId.Value <= 0)
        {
            return "Fleet import must be executed inside a tenant workspace.";
        }

        var tenant = await context.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == tenantProvider.TenantId.Value, cancellationToken);
        if (tenant is null)
        {
            return "Tenant not found for fleet import.";
        }

        if (tenant.OperationalType is not (TenantOperationalType.Logistics or TenantOperationalType.Fleet))
        {
            return "Only logistics or fleet tenants can own fleets.";
        }

        return null;
    }

    private static ValidationResult ValidateRows(IReadOnlyList<ImportFleetRowInput> rows)
    {
        var errors = new List<ImportFleetRowError>();
        var validRows = new List<ImportFleetRowInput>();
        if (rows.Count == 0)
        {
            errors.Add(new ImportFleetRowError(0, "No rows found in upload."));
            return new ValidationResult(validRows, errors);
        }

        if (rows.Count > MaxRows)
        {
            errors.Add(new ImportFleetRowError(0, $"Maximum allowed rows per upload is {MaxRows}."));
            return new ValidationResult(validRows, errors);
        }

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var row in rows)
        {
            var rowErrors = new List<string>();
            var registration = row.RegistrationNumber?.Trim().ToUpperInvariant() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(registration)) rowErrors.Add("RegistrationNumber is required.");
            if (row.Capacity <= 0) rowErrors.Add("Capacity must be greater than zero.");
            if (!string.IsNullOrWhiteSpace(registration) && !seen.Add(registration))
            {
                rowErrors.Add("Duplicate RegistrationNumber in import rows.");
            }

            if (rowErrors.Count == 0)
            {
                validRows.Add(row with { RegistrationNumber = registration });
                continue;
            }

            errors.AddRange(rowErrors.Select(error => new ImportFleetRowError(row.RowNumber, error)));
        }

        return new ValidationResult(validRows, errors);
    }

    private static string GenerateBatchRef(string prefix) => $"{prefix}-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString()[..6].ToUpperInvariant()}";

    private sealed record ValidationResult(IReadOnlyList<ImportFleetRowInput> ValidRows, IReadOnlyList<ImportFleetRowError> Errors);
}
