using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CargoMint.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCaptainAndFleetTrips : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FleetTripId",
                table: "Manifests",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Captains",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    CaptainCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsAvailable = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LastModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Captains", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Captains_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "FleetTrips",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    TripCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FleetId = table.Column<int>(type: "int", nullable: false),
                    CaptainId = table.Column<int>(type: "int", nullable: false),
                    DepartureTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ArrivalTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FuelCosts = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    DistanceTravelled = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LastModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FleetTrips", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FleetTrips_Captains_CaptainId",
                        column: x => x.CaptainId,
                        principalTable: "Captains",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FleetTrips_Fleets_FleetId",
                        column: x => x.FleetId,
                        principalTable: "Fleets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Manifests_FleetTripId",
                table: "Manifests",
                column: "FleetTripId");

            migrationBuilder.CreateIndex(
                name: "IX_Captains_TenantId_CaptainCode",
                table: "Captains",
                columns: new[] { "TenantId", "CaptainCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Captains_UserId",
                table: "Captains",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_FleetTrips_CaptainId",
                table: "FleetTrips",
                column: "CaptainId");

            migrationBuilder.CreateIndex(
                name: "IX_FleetTrips_FleetId",
                table: "FleetTrips",
                column: "FleetId");

            migrationBuilder.CreateIndex(
                name: "IX_FleetTrips_TenantId_TripCode",
                table: "FleetTrips",
                columns: new[] { "TenantId", "TripCode" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Manifests_FleetTrips_FleetTripId",
                table: "Manifests",
                column: "FleetTripId",
                principalTable: "FleetTrips",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Manifests_FleetTrips_FleetTripId",
                table: "Manifests");

            migrationBuilder.DropTable(
                name: "FleetTrips");

            migrationBuilder.DropTable(
                name: "Captains");

            migrationBuilder.DropIndex(
                name: "IX_Manifests_FleetTripId",
                table: "Manifests");

            migrationBuilder.DropColumn(
                name: "FleetTripId",
                table: "Manifests");
        }
    }
}
