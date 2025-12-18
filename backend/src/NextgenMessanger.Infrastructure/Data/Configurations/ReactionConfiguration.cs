using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NextgenMessanger.Core.Entities;

namespace NextgenMessanger.Infrastructure.Data.Configurations;

public class ReactionConfiguration : IEntityTypeConfiguration<Reaction>
{
    public void Configure(EntityTypeBuilder<Reaction> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Type)
            .HasMaxLength(20)
            .HasDefaultValue("like");

        builder.Property(r => r.CreatedAt)
            .HasDefaultValueSql("NOW()");

        builder.Property(r => r.UpdatedAt)
            .HasDefaultValueSql("NOW()");

        builder.HasIndex(r => r.PostId);

        builder.HasIndex(r => r.UserId);

        builder.HasIndex(r => r.Type);

        builder.HasIndex(r => new { r.PostId, r.UserId })
            .IsUnique();

        builder.HasOne(r => r.Post)
            .WithMany(p => p.Reactions)
            .HasForeignKey(r => r.PostId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.User)
            .WithMany(u => u.Reactions)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

