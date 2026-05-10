using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;

using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Shipments;

public record BulkShipmentRowInput(
    int RowNumber,
    string ReceiverName,
    string ReceiverPhone,
    string ReceiverAddress,
    int DestinationServiceCentreId,
    decimal DeclaredValue,
    string Description,
    int Quantity,
    double Weight,
    bool IsCod);

public record BulkUploadRowError(int RowNumber, string Error);

public record BulkUploadPreviewRow(
    int RowNumber,
    string ReceiverName,
    string ReceiverPhone,
    string ReceiverAddress,
    decimal EstimatedAmount,
    bool IsCod);

public record BulkUploadPreviewResponse(
    string BatchReference,
    int TotalRows,
    int ValidRows,
    int InvalidRows,
    decimal EstimatedTotalAmount,
    IReadOnlyList<BulkUploadPreviewRow> PreviewRows,
    IReadOnlyList<BulkUploadRowError> Errors,
    string? Message);

public record BulkUploadConfirmResponse(
    string BatchId,
    int CreatedCount,
    int FailedCount,
    decimal TotalAmount,
    IReadOnlyList<string> Waybills,
    IReadOnlyList<BulkUploadRowError> Errors,
    string? Message);

public record PreviewBulkMerchantShipmentsCommand(
    string MerchantEmail,
    IReadOnlyList<BulkShipmentRowInput> Rows) : IRequest<BulkUploadPreviewResponse>;

public record ConfirmBulkMerchantShipmentsCommand(
    string MerchantEmail,
    IReadOnlyList<BulkShipmentRowInput> Rows,
    bool SkipInvalidRows = true) : IRequest<BulkUploadConfirmResponse>;

public class BulkMerchantShipmentsHandler(ICargoMintDbContext context)
    : IRequestHandler<PreviewBulkMerchantShipmentsCommand, BulkUploadPreviewResponse>,
      IRequestHandler<ConfirmBulkMerchantShipmentsCommand, BulkUploadConfirmResponse>
{
    private const int MaxRows = 10000;

    public async Task<BulkUploadPreviewResponse> Handle(PreviewBulkMerchantShipmentsCommand request, CancellationToken cancellationToken)
    {
        var batchRef = GenerateBatchRef("PREVIEW");
        var merchant = await ResolveMerchantAsync(request.MerchantEmail, cancellationToken);
        if (merchant == null)
        {
            return EmptyPreview(batchRef, request.Rows.Count, "Merchant account is not linked to a valid customer profile.");
        }

        var validationResult = ValidateRows(request.Rows);
        var previewRows = validationResult.ValidRows
            .Select(row => new BulkUploadPreviewRow(
                row.RowNumber,
                row.ReceiverName,
                row.ReceiverPhone,
                row.ReceiverAddress,
                CalculateShipmentTotal(row),
                row.IsCod))
            .ToList();

        return new BulkUploadPreviewResponse(
            batchRef,
            request.Rows.Count,
            validationResult.ValidRows.Count,
            validationResult.Errors.Count,
            previewRows.Sum(x => x.EstimatedAmount),
            previewRows,
            validationResult.Errors,
            validationResult.Errors.Count == 0 ? "Preview is valid and ready for upload." : "Some rows contain validation errors.");
    }

    public async Task<BulkUploadConfirmResponse> Handle(ConfirmBulkMerchantShipmentsCommand request, CancellationToken cancellationToken)
    {
        var batchId = GenerateBatchRef("BULK");
        var merchant = await ResolveMerchantAsync(request.MerchantEmail, cancellationToken);
        if (merchant == null)
        {
            return new BulkUploadConfirmResponse(batchId, 0, request.Rows.Count, 0, [], [], "Merchant account is not linked to a valid customer profile.");
        }

        var validationResult = ValidateRows(request.Rows);
        var rowsToCreate = request.SkipInvalidRows ? validationResult.ValidRows : request.Rows;
        if (rowsToCreate.Count == 0)
        {
            return new BulkUploadConfirmResponse(batchId, 0, request.Rows.Count, 0, [], validationResult.Errors, "No valid rows to process.");
        }

        var waybills = new List<string>();
        decimal totalAmount = 0;
        foreach (var row in rowsToCreate)
        {
            if (!request.SkipInvalidRows && validationResult.Errors.Any(x => x.RowNumber == row.RowNumber))
            {
                continue;
            }

            var shipment = CreateShipmentEntity(row, merchant.CustomerCode, merchant.CustomerType);
            context.Shipments.Add(shipment);
            waybills.Add(shipment.Waybill);
            totalAmount += shipment.GrandTotal;
        }

        await context.SaveChangesAsync(cancellationToken);
        var failedCount = request.Rows.Count - waybills.Count;
        return new BulkUploadConfirmResponse(batchId, waybills.Count, failedCount, totalAmount, waybills, validationResult.Errors, "Batch processed successfully.");
    }

    private async Task<MerchantProfile?> ResolveMerchantAsync(string email, CancellationToken cancellationToken)
    {
        var individual = await context.IndividualCustomers
            .Where(c => c.Email == email)
            .Select(c => new MerchantProfile(c.CustomerCode, CustomerType.Individual))
            .FirstOrDefaultAsync(cancellationToken);
        if (individual != null)
        {
            return individual;
        }

        return await context.Companies
            .Where(c => c.Email == email)
            .Select(c => new MerchantProfile(c.CustomerCode, CustomerType.Company))
            .FirstOrDefaultAsync(cancellationToken);
    }

    private static ValidationResult ValidateRows(IReadOnlyList<BulkShipmentRowInput> rows)
    {
        var errors = new List<BulkUploadRowError>();
        var validRows = new List<BulkShipmentRowInput>();
        if (rows.Count == 0)
        {
            errors.Add(new BulkUploadRowError(0, "No rows found in upload."));
            return new ValidationResult(validRows, errors);
        }

        if (rows.Count > MaxRows)
        {
            errors.Add(new BulkUploadRowError(0, $"Maximum allowed rows per upload is {MaxRows}."));
            return new ValidationResult(validRows, errors);
        }

        foreach (var row in rows)
        {
            var rowErrors = ValidateRow(row);
            if (rowErrors.Count == 0)
            {
                validRows.Add(row);
                continue;
            }

            errors.AddRange(rowErrors.Select(error => new BulkUploadRowError(row.RowNumber, error)));
        }

        return new ValidationResult(validRows, errors);
    }

    private static IReadOnlyList<string> ValidateRow(BulkShipmentRowInput row)
    {
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(row.ReceiverName)) errors.Add("ReceiverName is required.");
        if (string.IsNullOrWhiteSpace(row.ReceiverPhone)) errors.Add("ReceiverPhone is required.");
        if (string.IsNullOrWhiteSpace(row.ReceiverAddress)) errors.Add("ReceiverAddress is required.");
        if (row.DestinationServiceCentreId <= 0) errors.Add("DestinationServiceCentreId must be greater than zero.");
        if (row.DeclaredValue <= 0) errors.Add("DeclaredValue must be greater than zero.");
        if (string.IsNullOrWhiteSpace(row.Description)) errors.Add("Description is required.");
        if (row.Quantity <= 0) errors.Add("Quantity must be greater than zero.");
        if (row.Weight <= 0) errors.Add("Weight must be greater than zero.");
        return errors;
    }

    private static Shipment CreateShipmentEntity(BulkShipmentRowInput row, string customerCode, CustomerType customerType)
    {
        var subtotal = row.DeclaredValue * row.Quantity;
        var vat = subtotal * 0.075m;
        var insurance = subtotal * 0.01m;
        var grandTotal = subtotal + vat + insurance;
        var waybill = $"WB{DateTime.UtcNow:yyyyMMdd}{Guid.NewGuid().ToString()[..6].ToUpper()}";

        var shipment = new Shipment
        {
            Waybill = waybill,
            CustomerCode = customerCode,
            CustomerType = customerType,
            ReceiverName = row.ReceiverName,
            ReceiverPhoneNumber = row.ReceiverPhone,
            ReceiverAddress = row.ReceiverAddress,
            DepartureServiceCentreId = 1,
            DestinationServiceCentreId = row.DestinationServiceCentreId,
            OriginType = ShipmentOriginType.Dropoff,
            Status = ShipmentScanStatus.ReceivedAtBranch,
            Total = subtotal,
            Vat = vat,
            Insurance = insurance,
            GrandTotal = grandTotal,
            IsCashOnDelivery = row.IsCod,
            CashOnDeliveryAmount = row.IsCod ? grandTotal : 0
        };

        shipment.Items.Add(new ShipmentItem
        {
            Description = row.Description,
            Quantity = row.Quantity,
            Weight = row.Weight,
            Price = row.DeclaredValue
        });

        return shipment;
    }

    private static decimal CalculateShipmentTotal(BulkShipmentRowInput row)
    {
        var subtotal = row.DeclaredValue * row.Quantity;
        return subtotal + (subtotal * 0.075m) + (subtotal * 0.01m);
    }

    private static string GenerateBatchRef(string prefix) => $"{prefix}-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

    private static BulkUploadPreviewResponse EmptyPreview(string batchRef, int totalRows, string message)
    {
        return new BulkUploadPreviewResponse(batchRef, totalRows, 0, totalRows, 0, [], [], message);
    }

    private sealed record MerchantProfile(string CustomerCode, CustomerType CustomerType);
    private sealed record ValidationResult(IReadOnlyList<BulkShipmentRowInput> ValidRows, IReadOnlyList<BulkUploadRowError> Errors);
}
