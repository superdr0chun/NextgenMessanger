using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NextgenMessanger.Core.Entities;

namespace NextgenMessanger.Infrastructure.Data.Configurations;

public class PostConfiguration : IEntityTypeConfiguration<Post>
{
    public void Configure(EntityTypeBuilder<Post> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Visibility)
            .HasMaxLength(20)
            .HasDefaultValue("public");

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

