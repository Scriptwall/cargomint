using CargoMint.Application.Features.Core.Shipments;
using ClosedXML.Excel;

namespace CargoMint.Api.Services;

public static class BulkShipmentFileParser
{
    public static async Task<List<BulkShipmentRowInput>> ParseAsync(IFormFile file, CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        await using var stream = file.OpenReadStream();

        return extension switch
        {
            ".csv" => await ParseCsvAsync(stream, cancellationToken),
            ".xlsx" => ParseXlsx(stream),
            _ => throw new InvalidOperationException("Only .csv and .xlsx files are supported.")
        };
    }

    private static async Task<List<BulkShipmentRowInput>> ParseCsvAsync(Stream stream, CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(stream);
        var rows = new List<BulkShipmentRowInput>();
        var lineNumber = 0;

        while (!reader.EndOfStream)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var line = await reader.ReadLineAsync(cancellationToken);
            lineNumber++;
            if (lineNumber == 1 || string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            var columns = line.Split(',');
            rows.Add(MapColumnsToRow(lineNumber, columns));
        }

        return rows;
    }

    private static List<BulkShipmentRowInput> ParseXlsx(Stream stream)
    {
        using var workbook = new XLWorkbook(stream);
        var sheet = workbook.Worksheet(1);
        var rows = new List<BulkShipmentRowInput>();
        var lastRow = sheet.LastRowUsed()?.RowNumber() ?? 1;

        for (var row = 2; row <= lastRow; row++)
        {
            var cells = new[]
            {
                sheet.Cell(row, 1).GetString(),
                sheet.Cell(row, 2).GetString(),
                sheet.Cell(row, 3).GetString(),
                sheet.Cell(row, 4).GetString(),
                sheet.Cell(row, 5).GetString(),
                sheet.Cell(row, 6).GetString(),
                sheet.Cell(row, 7).GetString(),
                sheet.Cell(row, 8).GetString(),
                sheet.Cell(row, 9).GetString()
            };
            if (cells.All(string.IsNullOrWhiteSpace))
            {
                continue;
            }

            rows.Add(MapColumnsToRow(row, cells));
        }

        return rows;
    }

    private static BulkShipmentRowInput MapColumnsToRow(int rowNumber, IReadOnlyList<string> columns)
    {
        static int ToInt(string? value) => int.TryParse(value, out var parsed) ? parsed : 0;
        static decimal ToDecimal(string? value) => decimal.TryParse(value, out var parsed) ? parsed : 0;
        static double ToDouble(string? value) => double.TryParse(value, out var parsed) ? parsed : 0;
        static bool ToBool(string? value) => value?.Trim().ToLowerInvariant() is "1" or "true" or "yes";

        return new BulkShipmentRowInput(
            rowNumber,
            columns.ElementAtOrDefault(0) ?? string.Empty,
            columns.ElementAtOrDefault(1) ?? string.Empty,
            columns.ElementAtOrDefault(2) ?? string.Empty,
            ToInt(columns.ElementAtOrDefault(3)),
            ToDecimal(columns.ElementAtOrDefault(4)),
            columns.ElementAtOrDefault(5) ?? string.Empty,
            ToInt(columns.ElementAtOrDefault(6)),
            ToDouble(columns.ElementAtOrDefault(7)),
            ToBool(columns.ElementAtOrDefault(8)));
    }
}

