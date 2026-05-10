using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CargoMint.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDropoffManifestFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OriginType",
                table: "Shipments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CaptainId",
                table: "Manifests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Manifests",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Manifests_CaptainId",
                table: "Manifests",
                column: "CaptainId");

            migrationBuilder.AddForeignKey(
                name: "FK_Manifests_Captains_CaptainId",
                table: "Manifests",
                column: "CaptainId",
                principalTable: "Captains",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Manifests_Captains_CaptainId",
                table: "Manifests");

            migrationBuilder.DropIndex(
                name: "IX_Manifests_CaptainId",
                table: "Manifests");

            migrationBuilder.DropColumn(
                name: "OriginType",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "CaptainId",
                table: "Manifests");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Manifests");
        }
    }
}
