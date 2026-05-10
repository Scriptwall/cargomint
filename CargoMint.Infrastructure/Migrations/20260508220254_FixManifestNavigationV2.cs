using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CargoMint.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixManifestNavigationV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Manifests_DepartureServiceCentreId",
                table: "Manifests",
                column: "DepartureServiceCentreId");

            migrationBuilder.CreateIndex(
                name: "IX_Manifests_DestinationServiceCentreId",
                table: "Manifests",
                column: "DestinationServiceCentreId");

            migrationBuilder.AddForeignKey(
                name: "FK_Manifests_ServiceCentres_DepartureServiceCentreId",
                table: "Manifests",
                column: "DepartureServiceCentreId",
                principalTable: "ServiceCentres",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Manifests_ServiceCentres_DestinationServiceCentreId",
                table: "Manifests",
                column: "DestinationServiceCentreId",
                principalTable: "ServiceCentres",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Manifests_ServiceCentres_DepartureServiceCentreId",
                table: "Manifests");

            migrationBuilder.DropForeignKey(
                name: "FK_Manifests_ServiceCentres_DestinationServiceCentreId",
                table: "Manifests");

            migrationBuilder.DropIndex(
                name: "IX_Manifests_DepartureServiceCentreId",
                table: "Manifests");

            migrationBuilder.DropIndex(
                name: "IX_Manifests_DestinationServiceCentreId",
                table: "Manifests");
        }
    }
}
