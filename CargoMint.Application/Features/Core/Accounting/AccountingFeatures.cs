using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;

using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Features.Core.Accounting;

public record CreateInvoiceCommand(
    string Waybill, 
    decimal Amount, 
    int ServiceCentreId, 
    PaymentType PaymentType) : IRequest<int>;

public record RecordLedgerCommand(
    decimal Amount, 
    CreditDebitType Type, 
    string Description, 
    string? Waybill = null) : IRequest<int>;

public class AccountingHandler(ICargoMintDbContext context) : 
    IRequestHandler<CreateInvoiceCommand, int>,
    IRequestHandler<RecordLedgerCommand, int>
{
    public async Task<int> Handle(CreateInvoiceCommand request, CancellationToken cancellationToken)
    {
        var invoice = new Invoice
        {
            InvoiceNumber = $"INV-{request.Waybill}",
            Amount = request.Amount,
            Waybill = request.Waybill,
            ServiceCentreId = request.ServiceCentreId,
            PaymentType = request.PaymentType,
            PaymentStatus = PaymentStatus.Pending
        };

        context.Invoices.Add(invoice);
        await context.SaveChangesAsync(cancellationToken);
        return invoice.Id;
    }

    public async Task<int> Handle(RecordLedgerCommand request, CancellationToken cancellationToken)
    {
        var entry = new GeneralLedger
        {
            Amount = request.Amount,
            CreditDebitType = request.Type,
            Description = request.Description,
            Waybill = request.Waybill,
            PaymentType = PaymentType.Wallet // Default
        };

        context.GeneralLedgers.Add(entry);
        await context.SaveChangesAsync(cancellationToken);
        return entry.Id;
    }
}
