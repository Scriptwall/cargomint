using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CargoMint.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CaptainFleetAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ParentHubId",
                table: "ServiceCentres",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AssignedCaptainId",
                table: "Fleets",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ZoneMatrixRates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    OriginZoneId = table.Column<int>(type: "int", nullable: false),
                    DestinationZoneId = table.Column<int>(type: "int", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LastModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZoneMatrixRates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZoneMatrixRates_Zones_DestinationZoneId",
                        column: x => x.DestinationZoneId,
                        principalTable: "Zones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ZoneMatrixRates_Zones_OriginZoneId",
                        column: x => x.OriginZoneId,
                        principalTable: "Zones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceCentres_ParentHubId",
                table: "ServiceCentres",
                column: "ParentHubId");

            migrationBuilder.CreateIndex(
                name: "IX_Fleets_AssignedCaptainId",
                table: "Fleets",
                column: "AssignedCaptainId");

            migrationBuilder.CreateIndex(
                name: "IX_Fleets_TenantId_AssignedCaptainId_IsActive",
                table: "Fleets",
                columns: new[] { "TenantId", "AssignedCaptainId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_ZoneMatrixRates_DestinationZoneId",
                table: "ZoneMatrixRates",
                column: "DestinationZoneId");

            migrationBuilder.CreateIndex(
                name: "IX_ZoneMatrixRates_OriginZoneId",
                table: "ZoneMatrixRates",
                column: "OriginZoneId");

            migrationBuilder.CreateIndex(
                name: "IX_ZoneMatrixRates_TenantId_OriginZoneId_DestinationZoneId",
                table: "ZoneMatrixRates",
                columns: new[] { "TenantId", "OriginZoneId", "DestinationZoneId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Fleets_Captains_AssignedCaptainId",
                table: "Fleets",
                column: "AssignedCaptainId",
                principalTable: "Captains",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceCentres_ServiceCentres_ParentHubId",
                table: "ServiceCentres",
                column: "ParentHubId",
                principalTable: "ServiceCentres",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Fleets_Captains_AssignedCaptainId",
                table: "Fleets");

            migrationBuilder.DropForeignKey(
                name: "FK_ServiceCentres_ServiceCentres_ParentHubId",
                table: "ServiceCentres");

            migrationBuilder.DropTable(
                name: "ZoneMatrixRates");

            migrationBuilder.DropIndex(
                name: "IX_ServiceCentres_ParentHubId",
                table: "ServiceCentres");

            migrationBuilder.DropIndex(
                name: "IX_Fleets_AssignedCaptainId",
                table: "Fleets");

            migrationBuilder.DropIndex(
                name: "IX_Fleets_TenantId_AssignedCaptainId_IsActive",
                table: "Fleets");

            migrationBuilder.DropColumn(
                name: "ParentHubId",
                table: "ServiceCentres");

            migrationBuilder.DropColumn(
                name: "AssignedCaptainId",
                table: "Fleets");
        }
    }
}
