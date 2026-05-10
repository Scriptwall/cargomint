using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;

using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace CargoMint.Application.Features.Core.Customers;

// ── Rate Cards ─────────────────────────────────────────────────────────────────

public record MerchantRateCardDto(
    int Id,
    string MerchantCode,
    string ZoneName,
    ShipmentType ShipmentType,
    decimal? OverridePrice,
    decimal? DiscountPercent,
    bool IsActive,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo);

public record GetMerchantRateCardsQuery(string MerchantCode)
    : IRequest<List<MerchantRateCardDto>>;

public record UpdateMerchantRateCardCommand(
    int RateCardId,
    decimal? OverridePrice,
    decimal? DiscountPercent,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo) : IRequest<bool>;

// ── API Keys ───────────────────────────────────────────────────────────────────

public record MerchantApiKeyDto(
    int Id,
    string KeyName,
    string KeyPrefix,
    bool IsRevoked,
    DateTime? ExpiresAt,
    DateTime CreatedAt);

public record GenerateMerchantApiKeyCommand(string MerchantCode, string KeyName, DateTime? ExpiresAt)
    : IRequest<GenerateMerchantApiKeyResult>;

public record GenerateMerchantApiKeyResult(string RawKey, MerchantApiKeyDto Summary);

public record GetMerchantApiKeysQuery(string MerchantCode)
    : IRequest<List<MerchantApiKeyDto>>;

public record RevokeMerchantApiKeyCommand(int ApiKeyId, string MerchantCode)
    : IRequest<bool>;

// ── Webhook Registrations ──────────────────────────────────────────────────────

public record MerchantWebhookDto(int Id, string Url, string Events, bool IsActive, DateTime CreatedAt);

public record RegisterMerchantWebhookCommand(string MerchantCode, string Url, string? Secret, string Events)
    : IRequest<int>;

public record GetMerchantWebhooksQuery(string MerchantCode)
    : IRequest<List<MerchantWebhookDto>>;

public record DeleteMerchantWebhookCommand(int WebhookId, string MerchantCode)
    : IRequest<bool>;

// ── Handlers ───────────────────────────────────────────────────────────────────

public class MerchantRateCardHandler(ICargoMintDbContext context)
    : IRequestHandler<GetMerchantRateCardsQuery, List<MerchantRateCardDto>>,
      IRequestHandler<UpdateMerchantRateCardCommand, bool>
{
    public async Task<List<MerchantRateCardDto>> Handle(
        GetMerchantRateCardsQuery request, CancellationToken cancellationToken)
    {
        return await context.MerchantContractRateCards
            .AsNoTracking()
            .Include(r => r.Zone)
            .Where(r => r.MerchantCode == request.MerchantCode)
            .Select(r => new MerchantRateCardDto(
                r.Id,
                r.MerchantCode,
                r.Zone != null ? r.Zone.Name : "Unknown",
                r.ShipmentType,
                r.OverridePrice,
                r.DiscountPercent,
                r.IsActive,
                r.EffectiveFrom,
                r.EffectiveTo))
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> Handle(
        UpdateMerchantRateCardCommand request, CancellationToken cancellationToken)
    {
        var card = await context.MerchantContractRateCards
            .FirstOrDefaultAsync(r => r.Id == request.RateCardId, cancellationToken);

        if (card == null) return false;

        card.OverridePrice = request.OverridePrice;
        card.DiscountPercent = request.DiscountPercent;
        card.EffectiveFrom = request.EffectiveFrom;
        card.EffectiveTo = request.EffectiveTo;

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class MerchantApiKeyHandler(ICargoMintDbContext context)
    : IRequestHandler<GenerateMerchantApiKeyCommand, GenerateMerchantApiKeyResult>,
      IRequestHandler<GetMerchantApiKeysQuery, List<MerchantApiKeyDto>>,
      IRequestHandler<RevokeMerchantApiKeyCommand, bool>
{
    public async Task<GenerateMerchantApiKeyResult> Handle(
        GenerateMerchantApiKeyCommand request, CancellationToken cancellationToken)
    {
        // Generate a cryptographically secure raw key
        var rawKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .Replace("+", "-").Replace("/", "_").Replace("=", "")[..40];

        var keyHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawKey))).ToLower();
        var keyPrefix = rawKey[..8];

        var entity = new MerchantApiKey
        {
            MerchantCode = request.MerchantCode,
            KeyName = request.KeyName,
            KeyHash = keyHash,
            KeyPrefix = keyPrefix,
            ExpiresAt = request.ExpiresAt
        };

        context.MerchantApiKeys.Add(entity);
        await context.SaveChangesAsync(cancellationToken);

        var dto = new MerchantApiKeyDto(entity.Id, entity.KeyName, keyPrefix, false, request.ExpiresAt, entity.CreatedAt);
        return new GenerateMerchantApiKeyResult(rawKey, dto);
    }

    public async Task<List<MerchantApiKeyDto>> Handle(
        GetMerchantApiKeysQuery request, CancellationToken cancellationToken)
    {
        return await context.MerchantApiKeys
            .AsNoTracking()
            .Where(k => k.MerchantCode == request.MerchantCode)
            .OrderByDescending(k => k.CreatedAt)
            .Select(k => new MerchantApiKeyDto(
                k.Id, k.KeyName, k.KeyPrefix + "********",
                k.IsRevoked, k.ExpiresAt, k.CreatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> Handle(
        RevokeMerchantApiKeyCommand request, CancellationToken cancellationToken)
    {
        var key = await context.MerchantApiKeys
            .FirstOrDefaultAsync(k => k.Id == request.ApiKeyId &&
                                      k.MerchantCode == request.MerchantCode, cancellationToken);
        if (key == null) return false;

        key.IsRevoked = true;
        key.RevokedAt = DateTime.UtcNow;

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public class MerchantWebhookHandler(ICargoMintDbContext context)
    : IRequestHandler<RegisterMerchantWebhookCommand, int>,
      IRequestHandler<GetMerchantWebhooksQuery, List<MerchantWebhookDto>>,
      IRequestHandler<DeleteMerchantWebhookCommand, bool>
{
    public async Task<int> Handle(
        RegisterMerchantWebhookCommand request, CancellationToken cancellationToken)
    {
        var webhook = new MerchantWebhook
        {
            MerchantCode = request.MerchantCode,
            Url = request.Url,
            Secret = request.Secret,
            Events = request.Events
        };
        context.MerchantWebhooks.Add(webhook);
        await context.SaveChangesAsync(cancellationToken);
        return webhook.Id;
    }

    public async Task<List<MerchantWebhookDto>> Handle(
        GetMerchantWebhooksQuery request, CancellationToken cancellationToken)
    {
        return await context.MerchantWebhooks
            .AsNoTracking()
            .Where(w => w.MerchantCode == request.MerchantCode && w.IsActive)
            .Select(w => new MerchantWebhookDto(w.Id, w.Url, w.Events, w.IsActive, w.CreatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> Handle(
        DeleteMerchantWebhookCommand request, CancellationToken cancellationToken)
    {
        var webhook = await context.MerchantWebhooks
            .FirstOrDefaultAsync(w => w.Id == request.WebhookId &&
                                      w.MerchantCode == request.MerchantCode, cancellationToken);
        if (webhook == null) return false;

        webhook.IsActive = false;
        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
