using CargoMint.Application.Features.Core.Shipments;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CargoMint.Api.Controllers.Core;

[ApiController]
[Route("api/v1/consumer")]
public class ConsumerController(IMediator mediator) : ControllerBase
{
    /// <summary>
    /// Step 1 — Initiate a booking session. Returns a session token encoding sender/receiver/items.
    /// No authentication required.
    /// </summary>
    [HttpPost("bookings/initiate")]
    public async Task<IActionResult> Initiate([FromBody] InitiateBookingCommand command)
    {
        var session = await mediator.Send(command);
        return Ok(session);
    }

    /// <summary>
    /// Step 2 — Get a full itemized price quote for the booking session.
    /// No authentication required.
    /// </summary>
    [HttpGet("bookings/{sessionId}/quote")]
    public async Task<IActionResult> GetQuote(string sessionId)
    {
        var quote = await mediator.Send(new GetBookingQuoteQuery(sessionId));
        return quote == null
            ? BadRequest("Invalid session or no pricing found for this route.")
            : Ok(quote);
    }

    /// <summary>
    /// Step 3 — Confirm booking. Creates the shipment and returns waybill.
    /// Authentication optional (COD/guest allowed).
    /// </summary>
    [HttpPost("bookings/confirm")]
    public async Task<IActionResult> ConfirmBooking([FromBody] ConfirmBookingCommand command)
    {
        var result = await mediator.Send(command);
        return Ok(result);
    }
}

