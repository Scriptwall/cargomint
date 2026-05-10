using CargoMint.Application.Features.Core.Logistics;
using CargoMint.Api.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CargoMint.Api.Controllers.Core;

[Authorize(Policy = AuthorizationPolicies.LogisticsOps)]
[ApiController]
[Route("api/v1/[controller]")]
public class ConsolidationController(IMediator mediator) : ControllerBase
{
    [HttpPost("group")]
    public async Task<IActionResult> CreateGroup([FromBody] CreateShipmentGroupCommand command)
    {
        var result = await mediator.Send(command);
        return Ok(new { GroupCode = result });
    }

    [HttpPost("scan")]
    public async Task<IActionResult> ScanItem([FromBody] AddShipmentToGroupCommand command)
    {
        var result = await mediator.Send(command);
        if (!result) return BadRequest("Failed to add item to group. Check codes.");
        return Ok(new { Success = true, Message = $"Item {command.Waybill} added to group {command.GroupCode}" });
    }

    [HttpGet("sort-pool")]
    public async Task<IActionResult> GetSortPool()
    {
        var result = await mediator.Send(new CargoMint.Application.Features.Core.Logistics.Queries.GetSortPoolQuery());
        return Ok(result);
    }

    [HttpPut("manifests/{manifestCode}/dispatch")]
    public async Task<IActionResult> DispatchManifest(string manifestCode)
    {
        var result = await mediator.Send(new CargoMint.Application.Features.Core.Logistics.Commands.DispatchManifestCommand(manifestCode));
        return result ? Ok(new { Success = true, Message = "Manifest dispatched" }) : BadRequest("Failed to dispatch manifest");
    }
}

