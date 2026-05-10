using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CargoMint.Infrastructure.Migrations;

public partial class AddParentHubToServiceCentre : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "ParentHubId",
            table: "ServiceCentres",
            type: "int",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_ServiceCentres_ParentHubId",
            table: "ServiceCentres",
            column: "ParentHubId");

        migrationBuilder.AddForeignKey(
            name: "FK_ServiceCentres_ServiceCentres_ParentHubId",
            table: "ServiceCentres",
            column: "ParentHubId",
            principalTable: "ServiceCentres",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_ServiceCentres_ServiceCentres_ParentHubId",
            table: "ServiceCentres");

        migrationBuilder.DropIndex(
            name: "IX_ServiceCentres_ParentHubId",
            table: "ServiceCentres");

        migrationBuilder.DropColumn(
            name: "ParentHubId",
            table: "ServiceCentres");
    }
}
