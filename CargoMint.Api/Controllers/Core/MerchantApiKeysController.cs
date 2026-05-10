using CargoMint.Application.Features.Core.Customers;
using CargoMint.Api.Security;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CargoMint.Api.Controllers.Core;

[Authorize(Policy = AuthorizationPolicies.MerchantPortal)]
[ApiController]
[Route("api/v1/merchant")]
public class MerchantApiKeysController(IMediator mediator) : ControllerBase
{
    private string? MerchantCode => User.FindFirstValue(ClaimTypes.Email);

    // ── API Keys ──────────────────────────────────────────────────────────────

    [HttpGet("api-keys")]
    public async Task<IActionResult> ListApiKeys()
    {
        if (MerchantCode is null) return Unauthorized();
        return Ok(await mediator.Send(new GetMerchantApiKeysQuery(MerchantCode)));
    }

    [HttpPost("api-keys")]
    public async Task<IActionResult> GenerateApiKey([FromBody] GenerateApiKeyRequest request)
    {
        if (MerchantCode is null) return Unauthorized();
        var result = await mediator.Send(
            new GenerateMerchantApiKeyCommand(MerchantCode, request.KeyName, request.ExpiresAt));
        // Return raw key ONCE — client must copy it now
        return Ok(new
        {
            result.RawKey,
            result.Summary,
            Warning = "Store this key securely. It will not be shown again."
        });
    }

    [HttpDelete("api-keys/{id:int}")]
    public async Task<IActionResult> RevokeApiKey(int id)
    {
        if (MerchantCode is null) return Unauthorized();
        var result = await mediator.Send(new RevokeMerchantApiKeyCommand(id, MerchantCode));
        return result ? NoContent() : NotFound();
    }

    // ── Webhooks ──────────────────────────────────────────────────────────────

    [HttpGet("webhooks")]
    public async Task<IActionResult> ListWebhooks()
    {
        if (MerchantCode is null) return Unauthorized();
        return Ok(await mediator.Send(new GetMerchantWebhooksQuery(MerchantCode)));
    }

    [HttpPost("webhooks")]
    public async Task<IActionResult> RegisterWebhook([FromBody] RegisterWebhookRequest request)
    {
        if (MerchantCode is null) return Unauthorized();
        var id = await mediator.Send(
            new RegisterMerchantWebhookCommand(MerchantCode, request.Url, request.Secret, request.Events));
        return Ok(new { WebhookId = id, Message = "Webhook registered." });
    }

    [HttpDelete("webhooks/{id:int}")]
    public async Task<IActionResult> DeleteWebhook(int id)
    {
        if (MerchantCode is null) return Unauthorized();
        var result = await mediator.Send(new DeleteMerchantWebhookCommand(id, MerchantCode));
        return result ? NoContent() : NotFound();
    }

    // ── Rate Cards ─────────────────────────────────────────────────────────────

    [HttpGet("rate-cards")]
    public async Task<IActionResult> GetRateCards()
    {
        if (MerchantCode is null) return Unauthorized();
        return Ok(await mediator.Send(new GetMerchantRateCardsQuery(MerchantCode)));
    }

    [HttpPut("rate-cards/{id:int}")]
    [Authorize(Policy = AuthorizationPolicies.LogisticsOps)] // TenantAdmin approves
    public async Task<IActionResult> UpdateRateCard(int id, [FromBody] UpdateRateCardRequest request)
    {
        var result = await mediator.Send(
            new UpdateMerchantRateCardCommand(id, request.OverridePrice, request.DiscountPercent,
                request.EffectiveFrom, request.EffectiveTo));
        return result ? NoContent() : NotFound();
    }
}

// ── Request DTOs ──────────────────────────────────────────────────────────────

public record GenerateApiKeyRequest(string KeyName, DateTime? ExpiresAt);
public record RegisterWebhookRequest(string Url, string? Secret, string Events);
public record UpdateRateCardRequest(
    decimal? OverridePrice,
    decimal? DiscountPercent,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo);

