using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CargoMint.Api.Security;
using CargoMint.Application.Features.Core.Support;

namespace CargoMint.Api.Controllers.Core;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class SupportController(IMediator mediator) : ControllerBase
{
    [HttpGet("tickets")]
    public async Task<IActionResult> GetTickets(
        [FromQuery] string? status = null,
        [FromQuery] string? priority = null,
        [FromQuery] string? category = null,
        [FromQuery] string? search = null)
    {
        var tickets = await mediator.Send(new GetTicketsQuery(status, priority, category, search));
        return Ok(tickets);
    }

    [HttpGet("tickets/{ticketId}")]
    public async Task<IActionResult> GetTicketDetail(int ticketId)
    {
        var ticket = await mediator.Send(new GetTicketDetailQuery(ticketId));
        return ticket != null ? Ok(ticket) : NotFound();
    }

    [HttpPost("tickets")]
    [Authorize(Policy = AuthorizationPolicies.LogisticsOps)]
    public async Task<IActionResult> CreateTicket([FromBody] CreateTicketCommand command)
    {
        var result = await mediator.Send(command);
        return Ok(result);
    }

    [HttpPost("tickets/{ticketId}/messages")]
    [Authorize(Policy = AuthorizationPolicies.LogisticsOps)]
    public async Task<IActionResult> SendMessage(int ticketId, [FromBody] SendMessageCommand command)
    {
        if (ticketId != command.TicketId) return BadRequest();
        var result = await mediator.Send(command);
        return Ok(result);
    }

    [HttpPut("tickets/{ticketId}/status")]
    [Authorize(Policy = AuthorizationPolicies.TenantAdminPortal)]
    public async Task<IActionResult> UpdateTicketStatus(int ticketId, [FromBody] UpdateTicketStatusCommand command)
    {
        if (ticketId != command.TicketId) return BadRequest();
        var result = await mediator.Send(command);
        return result ? Ok() : NotFound();
    }

    [HttpPost("tickets/{ticketId}/escalate")]
    [Authorize(Policy = AuthorizationPolicies.TenantAdminPortal)]
    public async Task<IActionResult> EscalateTicket(int ticketId)
    {
        var result = await mediator.Send(new EscalateTicketCommand(ticketId));
        return result ? Ok("Ticket escalated to platform support") : NotFound();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await mediator.Send(new GetTicketStatsQuery());
        return Ok(stats);
    }
}

