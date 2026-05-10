using CargoMint.Application.Features.Core.Wallets;
using CargoMint.Api.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CargoMint.Api.Controllers.Core;

[Authorize(Policy = AuthorizationPolicies.FinanceOps)]
[ApiController]
[Route("api/v1/[controller]")]
public class WalletsController(IMediator mediator) : ControllerBase
{
    [HttpGet("balance/{customerCode}")]
    public async Task<IActionResult> GetBalance(string customerCode)
    {
        var result = await mediator.Send(new GetWalletBalanceQuery(customerCode));
        return result != null ? Ok(result) : NotFound();
    }

    [HttpPost("credit")]
    public async Task<IActionResult> Credit([FromBody] CreditWalletCommand command)
    {
        var result = await mediator.Send(command);
        return result ? Ok("Wallet credited successfully.") : BadRequest("Failed to credit wallet.");
    }
}

