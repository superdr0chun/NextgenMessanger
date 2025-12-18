using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NextgenMessanger.Core.Entities;

namespace NextgenMessanger.Infrastructure.Data.Configurations;

public class ProfileConfiguration : IEntityTypeConfiguration<Profile>
{
    public void Configure(EntityTypeBuilder<Profile> builder)
    {
        builder.HasKey(p => p.UserId);

        builder.Property(p => p.AvatarUrl)
            .HasMaxLength(500);

        builder.Property(p => p.Phone)
            .HasMaxLength(20);

        builder.Property(p => p.Location)
            .HasMaxLength(100);

        builder.Property(p => p.CreatedAt)
            .HasDefaultValueSql("NOW()");

        builder.Property(p => p.UpdatedAt)
            .HasDefaultValueSql("NOW()");
    }
}

