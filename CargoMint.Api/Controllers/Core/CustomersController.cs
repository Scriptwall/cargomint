using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CargoMint.Api.Security;
using CargoMint.Application.Features.Core.Customers.Queries;
using CargoMint.Application.Features.Core.Customers;
using CargoMint.Application.Features.Core.Shipments;
using System.Security.Claims;
using CargoMint.Api.Services;

namespace CargoMint.Api.Controllers.Core;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class CustomersController(IMediator mediator) : ControllerBase
{
    [HttpGet("search")]
    [Authorize(Policy = AuthorizationPolicies.LogisticsOps)]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        return Ok(await mediator.Send(new SearchCustomersQuery(q)));
    }

    // --- INDIVIDUAL CUSTOMER ENDPOINTS ---

    [HttpPost("individual")]
    [Authorize(Policy = AuthorizationPolicies.LogisticsOps)]
    public async Task<IActionResult> CreateIndividual([FromBody] CreateIndividualCustomerCommand command)
    {
        var customerId = await mediator.Send(command);
        return Ok(new { Id = customerId, Message = "Customer created successfully" });
    }

    [HttpGet("retail")]
    [Authorize(Policy = AuthorizationPolicies.LogisticsOps)]
    public async Task<IActionResult> GetRetail()
    {
        return Ok(await mediator.Send(new GetRetailCustomersQuery()));
    }

    [HttpGet("merchant/dashboard")]
    [Authorize(Policy = AuthorizationPolicies.MerchantPortal)]
    public async Task<IActionResult> GetMerchantDashboard()
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrEmpty(email)) return Unauthorized();
        return Ok(await mediator.Send(new GetMerchantDashboardQuery(email)));
    }

    [HttpGet("merchant/shipments")]
    [Authorize(Policy = AuthorizationPolicies.MerchantPortal)]
    public async Task<IActionResult> GetMerchantShipments()
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrEmpty(email)) return Unauthorized();
        return Ok(await mediator.Send(new GetMerchantShipmentsQuery(email)));
    }

    [HttpGet("merchant/wallet")]
    [Authorize(Policy = AuthorizationPolicies.MerchantPortal)]
    public async Task<IActionResult> GetMerchantWallet()
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrEmpty(email)) return Unauthorized();
        return Ok(await mediator.Send(new GetMerchantWalletQuery(email)));
    }

    [HttpGet("merchant/address-book")]
    [Authorize(Policy = AuthorizationPolicies.MerchantPortal)]
    public async Task<IActionResult> GetMerchantAddressBook()
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrEmpty(email)) return Unauthorized();
        return Ok(await mediator.Send(new GetMerchantCustomersQuery(email)));
    }

    [HttpPost("merchant/bulk/preview")]
    [Authorize(Policy = AuthorizationPolicies.MerchantPortal)]
    public async Task<IActionResult> PreviewMerchantBulkUpload([FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0) return BadRequest("Upload file is required.");
        var email = User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrEmpty(email)) return Unauthorized();

        List<BulkShipmentRowInput> rows;
        try
        {
            rows = await BulkShipmentFileParser.ParseAsync(file, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }

        var result = await mediator.Send(new PreviewBulkMerchantShipmentsCommand(email, rows), cancellationToken);
        return Ok(result);
    }

    [HttpPost("merchant/bulk/confirm")]
    [Authorize(Policy = AuthorizationPolicies.MerchantPortal)]
    public async Task<IActionResult> ConfirmMerchantBulkUpload([FromForm] IFormFile file, [FromForm] bool skipInvalidRows = true, CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0) return BadRequest("Upload file is required.");
        var email = User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrEmpty(email)) return Unauthorized();

        List<BulkShipmentRowInput> rows;
        try
        {
            rows = await BulkShipmentFileParser.ParseAsync(file, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }

        var result = await mediator.Send(new ConfirmBulkMerchantShipmentsCommand(email, rows, skipInvalidRows), cancellationToken);
        return Ok(result);
    }

    [HttpGet("individual")]
    [Authorize(Policy = AuthorizationPolicies.LogisticsOps)]
    public async Task<IActionResult> GetIndividual([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var result = await mediator.Send(new GetIndividualCustomersQuery(pageNumber, pageSize));
        return Ok(result);
    }

    [HttpGet("individual/{id}")]
    [Authorize(Policy = AuthorizationPolicies.LogisticsOps)]
    public async Task<IActionResult> GetIndividualById(int id)
    {
        var result = await mediator.Send(new GetIndividualCustomerByIdQuery(id));
        return result != null ? Ok(result) : NotFound();
    }

    [HttpPut("individual/{id}")]
    [Authorize(Policy = AuthorizationPolicies.LogisticsOps)]
    public async Task<IActionResult> UpdateIndividual(int id, [FromBody] UpdateIndividualCustomerCommand command)
    {
        if (id != command.Id) return BadRequest();
        var result = await mediator.Send(command);
        return result ? NoContent() : NotFound();
    }

    [HttpDelete("individual/{id}")]
    [Authorize(Policy = AuthorizationPolicies.LogisticsOps)]
    public async Task<IActionResult> DeactivateIndividual(int id)
    {
        var result = await mediator.Send(new DeactivateIndividualCustomerCommand(id));
        return result ? NoContent() : NotFound();
    }

    // --- COMPANY ENDPOINTS ---

    [HttpPost("company")]
    [Authorize(Policy = AuthorizationPolicies.LogisticsOps)]
    public async Task<IActionResult> CreateCompany([FromBody] CreateCompanyCommand command)
    {
        var companyId = await mediator.Send(command);
        return Ok(new { Id = companyId, Message = "Company created successfully" });
    }

    [HttpGet("company")]
    [Authorize(Policy = AuthorizationPolicies.LogisticsOps)]
    public async Task<IActionResult> GetCompanies([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var result = await mediator.Send(new GetCompaniesQuery(pageNumber, pageSize));
        return Ok(result);
    }
}

