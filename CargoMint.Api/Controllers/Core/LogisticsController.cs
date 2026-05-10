using CargoMint.Api.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CargoMint.Application.Features.Core.Logistics.Queries;
using CargoMint.Application.Features.Core.Logistics;

namespace CargoMint.Api.Controllers.Core;

[Authorize(Policy = AuthorizationPolicies.LogisticsOps)]
[ApiController]
[Route("api/v1/[controller]")]
public class LogisticsController(IMediator mediator) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        return Ok(await mediator.Send(new GetOpsDashboardQuery()));
    }

    [HttpGet("manifests")]
    public async Task<IActionResult> GetManifests()
    {
        return Ok(await mediator.Send(new GetManifestsQuery()));
    }

    [HttpPost("manifest")]
    public async Task<IActionResult> CreateManifest([FromBody] CreateManifestCommand command)
    {
        var result = await mediator.Send(command);
        return Ok(new { ManifestCode = result });
    }

    [HttpPost("fleet")]
    public async Task<IActionResult> RegisterFleet([FromBody] RegisterFleetCommand command)
    {
        var fleetId = await mediator.Send(command);
        return Ok(new { Id = fleetId, Message = "Fleet vehicle registered successfully" });
    }

    [HttpPost("fleet/import/preview")]
    public async Task<IActionResult> PreviewFleetImport([FromBody] PreviewImportFleetsCommand command)
    {
        return Ok(await mediator.Send(command));
    }

    [HttpPost("fleet/import/confirm")]
    public async Task<IActionResult> ConfirmFleetImport([FromBody] ConfirmImportFleetsCommand command)
    {
        return Ok(await mediator.Send(command));
    }

    [HttpPost("dispatch")]
    public async Task<IActionResult> Dispatch([FromBody] DispatchManifestCommand command)
    {
        var result = await mediator.Send(command);
        return result.Success ? Ok(result) : BadRequest(result.Message);
    }

    [HttpPost("fleet/maintenance")]
    public async Task<IActionResult> ToggleMaintenance([FromBody] ToggleFleetMaintenanceCommand command)
    {
        return Ok(await mediator.Send(command));
    }

    [HttpGet("stations")]
    public async Task<IActionResult> GetStations()
    {
        return Ok(await mediator.Send(new GetLogisticsStationsQuery()));
    }
    [HttpGet("fleet")]
    public async Task<IActionResult> GetFleet()
    {
        return Ok(await mediator.Send(new GetFleetQuery()));
    }
}

