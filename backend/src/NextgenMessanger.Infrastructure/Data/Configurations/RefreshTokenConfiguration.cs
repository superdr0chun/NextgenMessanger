using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NextgenMessanger.Core.Entities;

namespace NextgenMessanger.Infrastructure.Data.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.HasKey(rt => rt.Id);

        builder.Property(rt => rt.Token)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(rt => rt.CreatedAt)
            .HasDefaultValueSql("NOW()");

        builder.Property(rt => rt.UpdatedAt)
            .HasDefaultValueSql("NOW()");

        builder.HasIndex(rt => rt.UserId);

        builder.HasIndex(rt => rt.Token)
            .IsUnique();

        builder.HasIndex(rt => rt.ExpiresAt);

        builder.HasIndex(rt => new { rt.UserId, rt.RevokedAt, rt.Deleted, rt.ExpiresAt });

        builder.HasIndex(rt => new { rt.Deleted, rt.DeletedAt });

        builder.ToTable(t => t.HasCheckConstraint("CK_RefreshToken_ExpiresAfterCreated", "\"ExpiresAt\" > \"CreatedAt\""));

        builder.HasOne(rt => rt.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

