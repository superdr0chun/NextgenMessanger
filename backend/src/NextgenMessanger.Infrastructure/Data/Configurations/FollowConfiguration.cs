using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using NextgenMessanger.Core.Entities;
using NextgenMessanger.Core.Enums;

namespace NextgenMessanger.Infrastructure.Data.Configurations;

public class FollowConfiguration : IEntityTypeConfiguration<Follow>
{
    public void Configure(EntityTypeBuilder<Follow> builder)
    {
        builder.HasKey(f => f.Id);

        var converter = new ValueConverter<FollowStatus, string>(
            v => v.ToString().ToLowerInvariant(),
            v => Enum.Parse<FollowStatus>(v, true));

        builder.Property(f => f.Status)
            .HasConversion(converter)
            .HasMaxLength(20);

        builder.Property(f => f.CreatedAt)
            .HasDefaultValueSql("NOW()");

        builder.Property(f => f.UpdatedAt)
            .HasDefaultValueSql("NOW()");

        builder.HasIndex(f => f.FollowerId);

        builder.HasIndex(f => f.FolloweeId);

        builder.HasIndex(f => f.Status);

        builder.HasIndex(f => new { f.FollowerId, f.Status, f.CreatedAt })
            .IsDescending();

        builder.HasIndex(f => new { f.FollowerId, f.FolloweeId })
            .IsUnique();

        builder.ToTable(t => t.HasCheckConstraint("CK_Follow_NotSelf", "\"FollowerId\" != \"FolloweeId\""));

        builder.HasOne(f => f.Follower)
            .WithMany(u => u.Followers)
            .HasForeignKey(f => f.FollowerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(f => f.Followee)
            .WithMany(u => u.Following)
            .HasForeignKey(f => f.FolloweeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

