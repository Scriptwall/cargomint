using CargoMint.Application.Features.Core.Accounting;
using CargoMint.Api.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CargoMint.Api.Controllers.Core;

[Authorize(Policy = AuthorizationPolicies.FinanceOps)]
[ApiController]
[Route("api/v1/[controller]")]
public class AccountingController(IMediator mediator) : ControllerBase
{
    [HttpPost("invoice")]
    public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceCommand command)
    {
        var result = await mediator.Send(command);
        return Ok(new { Id = result, Message = "Invoice generated successfully" });
    }

    [HttpPost("ledger")]
    public async Task<IActionResult> RecordLedger([FromBody] RecordLedgerCommand command)
    {
        var result = await mediator.Send(command);
        return Ok(new { Id = result, Message = "Ledger entry recorded successfully" });
    }
}

