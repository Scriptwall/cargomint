using CargoMint.Application.Features.Core.Pricing;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CargoMint.Api.Controllers.Core;

[ApiController]
[Route("api/v1/[controller]")]
public class PricingController(IMediator mediator) : ControllerBase
{
    [HttpGet("public-quote")]
    public async Task<IActionResult> GetPublicQuote([FromQuery] GetPriceQuoteQuery query)
    {
        var result = await mediator.Send(query);
        return result == null
            ? BadRequest("No pricing configuration found for this route and weight.")
            : Ok(result);
    }

    [HttpGet("quote")]
    public async Task<IActionResult> GetQuote([FromQuery] GetPriceQuoteQuery query)
    {
        var result = await mediator.Send(query);
        return result == null
            ? BadRequest("No pricing configuration found for this route and weight.")
            : Ok(result);
    }
}

