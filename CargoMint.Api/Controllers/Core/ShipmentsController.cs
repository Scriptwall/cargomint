using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CargoMint.Api.Security;
using CargoMint.Application.Features.Core.Shipments.Queries;
using CargoMint.Application.Features.Core.Shipments;

namespace CargoMint.Api.Controllers.Core;

[Authorize(Policy = AuthorizationPolicies.LogisticsOps)]
[ApiController]
[Route("api/v1/[controller]")]
public class ShipmentsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await mediator.Send(new GetShipmentsQuery()));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateShipmentCommand command)
    {
        var waybill = await mediator.Send(command);
        return Ok(new { Waybill = waybill, Message = "Shipment created successfully" });
    }

    [HttpPost("cancel")]
    public async Task<IActionResult> Cancel([FromBody] CancelShipmentCommand command)
    {
        var result = await mediator.Send(command);
        return result ? Ok("Shipment cancelled") : BadRequest("Failed to cancel");
    }

    [HttpPost("rts")]
    public async Task<IActionResult> ReturnToSender([FromBody] ReturnToSenderCommand command)
    {
        var returnWaybill = await mediator.Send(command);
        return Ok(new { ReturnWaybill = returnWaybill, Message = "RTS initiated" });
    }

    [HttpGet("{waybill}")]
    public async Task<IActionResult> GetByWaybill(string waybill)
    {
        var result = await mediator.Send(new GetShipmentByWaybillQuery(waybill));
        return result != null ? Ok(result) : NotFound();
    }

    [HttpPut("{waybill}")]
    public async Task<IActionResult> UpdateShipment(string waybill, [FromBody] UpdateShipmentCommand command)
    {
        if (waybill != command.Waybill) return BadRequest();
        var result = await mediator.Send(command);
        return result ? Ok() : NotFound();
    }

    [HttpPut("{waybill}/status")]
    public async Task<IActionResult> UpdateStatus(string waybill, [FromBody] UpdateShipmentStatusCommand command)
    {
        if (waybill != command.Waybill) return BadRequest();
        var result = await mediator.Send(command);
        return result ? Ok() : NotFound();
    }

    [HttpGet("{waybill}/preview")]
    public async Task<IActionResult> GetWaybillPreview(string waybill)
    {
        var result = await mediator.Send(new GetWaybillPreviewQuery(waybill));
        return result != null ? Ok(result) : NotFound();
    }
}

