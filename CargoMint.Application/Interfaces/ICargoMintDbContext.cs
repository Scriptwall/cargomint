using CargoMint.Domain.Entities.Core;
using Microsoft.EntityFrameworkCore;

namespace CargoMint.Application.Interfaces;

public interface ICargoMintDbContext
{
    // Core DB sets
    DbSet<Tenant> Tenants { get; }
    DbSet<Country> Countries { get; }
    DbSet<Region> Regions { get; }
    DbSet<State> States { get; }
    DbSet<Station> Stations { get; }
    DbSet<ServiceCentre> ServiceCentres { get; }
    DbSet<ApplicationUser> Users { get; }
    DbSet<IndividualCustomer> IndividualCustomers { get; }
    DbSet<Company> Companies { get; }
    DbSet<GeneralLedger> GeneralLedgers { get; }
    DbSet<ShipmentTracking> ShipmentTrackings { get; }
    DbSet<PreShipment> PreShipments { get; }
    DbSet<Wallet> Wallets { get; }
    DbSet<WalletTransaction> WalletTransactions { get; }
    DbSet<Shipment> Shipments { get; }
    DbSet<ShipmentItem> ShipmentItems { get; }
    DbSet<Zone> Zones { get; }
    DbSet<ZonePrice> ZonePrices { get; }
    DbSet<RouteZoneMap> RouteZoneMaps { get; }
    DbSet<CountryRouteZoneMap> CountryRouteZoneMaps { get; }
    DbSet<ZoneMatrixRate> ZoneMatrixRates { get; }
    DbSet<Fleet> Fleets { get; }
    DbSet<Manifest> Manifests { get; }
    DbSet<ManifestItem> ManifestItems { get; }
    DbSet<Captain> Captains { get; }
    DbSet<FleetTrip> FleetTrips { get; }
    DbSet<Invoice> Invoices { get; }
    // Enterprise DB sets removed to Enterprise DbContext
    DbSet<MaintenanceLog> MaintenanceLogs { get; }
    DbSet<ShipmentGroup> ShipmentGroups { get; }
    DbSet<ShipmentGroupItem> ShipmentGroupItems { get; }
    DbSet<MerchantContractRateCard> MerchantContractRateCards { get; }
    DbSet<MerchantApiKey> MerchantApiKeys { get; }
    DbSet<MerchantWebhook> MerchantWebhooks { get; }
    DbSet<TenantRolePermission> TenantRolePermissions { get; }
    DbSet<SupportTicket> SupportTickets { get; }
    DbSet<TicketMessage> TicketMessages { get; }
    DbSet<TenantSurcharge> TenantSurcharges { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
