using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using NextgenMessanger.Core.Entities;
using NextgenMessanger.Core.Enums;

namespace NextgenMessanger.Infrastructure.Data.Configurations;

public class ReactionConfiguration : IEntityTypeConfiguration<Reaction>
{
    public void Configure(EntityTypeBuilder<Reaction> builder)
    {
        builder.HasKey(r => r.Id);

        var converter = new ValueConverter<ReactionType, string>(
            v => v.ToString().ToLowerInvariant(),
            v => Enum.Parse<ReactionType>(v, true));

        builder.Property(r => r.Type)
            .HasConversion(converter)
            .HasMaxLength(20)
            .HasDefaultValue(ReactionType.Like);

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

