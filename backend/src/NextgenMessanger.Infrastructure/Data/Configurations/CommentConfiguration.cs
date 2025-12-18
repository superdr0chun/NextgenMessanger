using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NextgenMessanger.Core.Entities;

namespace NextgenMessanger.Infrastructure.Data.Configurations;

public class CommentConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Content)
            .IsRequired();

        builder.Property(c => c.CreatedAt)
            .HasDefaultValueSql("NOW()");

        builder.Property(c => c.UpdatedAt)
            .HasDefaultValueSql("NOW()");

        builder.HasIndex(c => c.PostId);

        builder.HasIndex(c => c.AuthorId);

        builder.HasIndex(c => c.CreatedAt);

        builder.HasIndex(c => new { c.Deleted, c.DeletedAt });

        builder.HasOne(c => c.Post)
            .WithMany(p => p.Comments)
            .HasForeignKey(c => c.PostId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.Author)
            .WithMany(u => u.Comments)
            .HasForeignKey(c => c.AuthorId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

