using CargoMint.Application.Features.Core.Wallets;
using CargoMint.Application.Interfaces;
using CargoMint.Domain.Entities.Core;

using CargoMint.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace CargoMint.Api.Controllers.Core;

[ApiController]
[Route("api/v1/[controller]")]
public class WebhooksController(
    IMediator mediator, 
    IPaymentGateway paymentGateway, 
    ICargoMintDbContext context,
    ILogger<WebhooksController> logger) : ControllerBase
{
    [HttpPost("paystack")]
    public async Task<IActionResult> PaystackWebhook([FromBody] JsonElement payload)
    {
        logger.LogInformation("Received Paystack Webhook");

        try
        {
            // 1. Basic Extraction
            // Paystack structure: { "event": "charge.success", "data": { "reference": "...", "amount": 5000, "customer": { "email": "..." } } }
            
            var eventType = payload.GetProperty("event").GetString();
            if (eventType != "charge.success")
            {
                logger.LogInformation("Ignoring non-success Paystack event: {Event}", eventType);
                return Ok();
            }

            var data = payload.GetProperty("data");
            var eventId = data.TryGetProperty("id", out var idEl) ? idEl.ToString() : null;
            var reference = data.GetProperty("reference").GetString();
            var amount = data.GetProperty("amount").GetDecimal() / 100; // Kobo to Naira
            var email = data.GetProperty("customer").GetProperty("email").GetString();

            if (string.IsNullOrEmpty(reference)) return BadRequest("Missing reference");
            if (string.IsNullOrWhiteSpace(eventId))
            {
                eventId = reference;
            }

            if (!await TryMarkWebhookAsProcessingAsync("paystack", eventId!, eventType, payload))
            {
                return Ok();
            }

            // 2. Double-Check Verification (Security Best Practice)
            var isValid = await paymentGateway.VerifyTransaction(reference);
            if (!isValid)
            {
                logger.LogWarning("Paystack Webhook Verification FAILED for Reference: {Reference}", reference);
                return BadRequest("Verification failed");
            }

            // 3. Credit Wallet
            // Note: In production, lookup the actual CustomerCode via metadata or email
            var command = new CreditWalletCommand(
                CustomerCode: email!, 
                Amount: amount,
                Description: $"Wallet Top-up via Paystack ({reference})",
                PaymentType: PaymentType.Wallet,
                Reference: reference
            );

            await mediator.Send(command);
            // Subscription logic handled by enterprise layer
            // await TryApplySubscriptionPaymentAsync(reference, amount, "Paystack");

            return Ok();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing Paystack webhook");
            return StatusCode(500, "Internal Server Error");
        }
    }

    [HttpPost("flutterwave")]
    public async Task<IActionResult> FlutterwaveWebhook([FromBody] JsonElement payload)
    {
        logger.LogInformation("Received Flutterwave Webhook");

        try
        {
            // Flutterwave structure: { "event": "charge.completed", "data": { "tx_ref": "...", "amount": 50, "customer": { "email": "..." } } }
            
            var eventType = payload.GetProperty("event").GetString();
            if (eventType != "charge.completed") return Ok();

            var data = payload.GetProperty("data");
            var eventId = data.TryGetProperty("id", out var idEl) ? idEl.ToString() : null;
            var reference = data.GetProperty("tx_ref").GetString();
            var amount = data.GetProperty("amount").GetDecimal();
            var email = data.GetProperty("customer").GetProperty("email").GetString();

            if (string.IsNullOrEmpty(reference)) return BadRequest();
            if (string.IsNullOrWhiteSpace(eventId))
            {
                eventId = reference;
            }

            if (!await TryMarkWebhookAsProcessingAsync("flutterwave", eventId!, eventType, payload))
            {
                return Ok();
            }

            // Verification logic would go here...
            
            await mediator.Send(new CreditWalletCommand(
                CustomerCode: email!,
                Amount: amount,
                Description: $"Wallet Top-up via Flutterwave ({reference})",
                PaymentType: PaymentType.Wallet,
                Reference: reference
            ));
            // Subscription logic handled by enterprise layer
            // await TryApplySubscriptionPaymentAsync(reference, amount, "Flutterwave");

            return Ok();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing Flutterwave webhook");
            return StatusCode(500, "Internal Server Error");
        }
    }

    private async Task<bool> TryMarkWebhookAsProcessingAsync(string gateway, string eventId, string? eventType, JsonElement payload)
    {
        // Duplicate detection and logging for enterprise webhooks moved to enterprise layer.
        // Core only processes wallet transactions for now.
        return true;
    }

    private async Task TryApplySubscriptionPaymentAsync(string reference, decimal amount, string gateway)
    {
        // Moved to enterprise layer
    }
}

