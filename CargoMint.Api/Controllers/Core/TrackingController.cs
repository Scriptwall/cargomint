using CargoMint.Application.Features.Core.Tracking;
using CargoMint.Api.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CargoMint.Api.Controllers.Core;

[ApiController]
[Route("api/v1/[controller]")]
public class TrackingController(IMediator mediator) : ControllerBase
{
    [HttpPost("scan")]
    [Authorize(Policy = AuthorizationPolicies.CaptainOps)]
    public async Task<IActionResult> AddScan([FromBody] AddTrackingScanCommand command)
    {
        await mediator.Send(command);
        return Ok(new { Message = "Scan recorded successfully" });
    }

    [HttpGet("{waybill}")]
    public async Task<IActionResult> GetStatus(string waybill)
    {
        var history = await mediator.Send(new GetTrackingHistoryQuery(waybill));
        return Ok(history);
    }

    [HttpGet("public/{waybill}")]
    public async Task<IActionResult> GetPublicTimeline(string waybill)
    {
        var timeline = await mediator.Send(new GetPublicTrackingTimelineQuery(waybill));
        return timeline == null ? NotFound() : Ok(timeline);
    }
}

