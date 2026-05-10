using CargoMint.Application.Features.Core.Account;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CargoMint.Api.Controllers.Core;

[ApiController]
[Route("api/v1/[controller]")]
public class AccountController(IMediator mediator) : ControllerBase
{
    public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        LoginResponse? response;
        try
        {
            response = await mediator.Send(request);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
        
        if (response == null)
        {
            return Unauthorized("Invalid credentials.");
        }

        return Ok(response);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await mediator.Send(request);
        
        if (!result)
        {
            return BadRequest("Registration failed.");
        }

        return Ok("User registered successfully.");
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userId, out var parsedUserId))
        {
            return Unauthorized();
        }

        var result = await mediator.Send(new ChangePasswordCommand(
            parsedUserId,
            request.CurrentPassword,
            request.NewPassword));

        return result ? Ok() : BadRequest("Unable to change password.");
    }
}

