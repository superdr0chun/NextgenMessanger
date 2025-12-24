using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using NextgenMessanger.Core.Entities;
using NextgenMessanger.Core.Enums;

namespace NextgenMessanger.Infrastructure.Data.Configurations;

public class PostConfiguration : IEntityTypeConfiguration<Post>
{
    public void Configure(EntityTypeBuilder<Post> builder)
    {
        builder.HasKey(p => p.Id);

        var converter = new ValueConverter<PostVisibility, string>(
            v => v.ToString().ToLowerInvariant(),
            v => Enum.Parse<PostVisibility>(v, true));

        builder.Property(p => p.Visibility)
            .HasConversion(converter)
            .HasMaxLength(20)
            .HasDefaultValue(PostVisibility.Public);

        builder.Property(p => p.CreatedAt)
            .HasDefaultValueSql("NOW()");

        builder.Property(p => p.UpdatedAt)
            .HasDefaultValueSql("NOW()");

        builder.Property(p => p.MediaUrl)
            .HasColumnType("text[]");

        builder.HasIndex(p => p.AuthorId);

        builder.HasIndex(p => p.CreatedAt)
            .IsDescending();

        builder.HasIndex(p => p.Visibility);

        builder.HasIndex(p => new { p.Deleted, p.DeletedAt });

        builder.HasIndex(p => new { p.AuthorId, p.Deleted, p.CreatedAt })
            .IsDescending();

        builder.HasIndex(p => new { p.AuthorId, p.Visibility, p.Deleted, p.CreatedAt })
            .IsDescending();

        builder.HasOne(p => p.Author)
            .WithMany(u => u.Posts)
            .HasForeignKey(p => p.AuthorId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

