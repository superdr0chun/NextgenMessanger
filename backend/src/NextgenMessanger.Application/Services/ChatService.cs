using Microsoft.EntityFrameworkCore;
using NextgenMessanger.Application.Interfaces;
using NextgenMessanger.Core.DTOs.Chat;
using NextgenMessanger.Infrastructure.Data;

namespace NextgenMessanger.Application.Services;

public class ChatService : IChatService
{
    private readonly ApplicationDbContext _context;

    public ChatService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ChatDto> CreateChatAsync(Guid userId, CreateChatDto createDto)
    {
        if (createDto.Type == "direct")
        {
            if (createDto.ParticipantIds.Count != 1)
            {
                throw new InvalidOperationException("Direct chat must have exactly one participant");
            }

            var otherUserId = createDto.ParticipantIds[0];
            if (otherUserId == userId)
            {
                throw new InvalidOperationException("Cannot create direct chat with yourself");
            }

            var existingChat = await _context.Chats
                .Where(c => c.Type == "direct" && !c.Deleted)
                .Join(_context.ChatParticipants.Where(cp => cp.UserId == userId && !cp.Deleted),
                    chat => chat.Id,
                    participant => participant.ChatId,
                    (chat, participant) => chat)
                .Join(_context.ChatParticipants.Where(cp => cp.UserId == otherUserId && !cp.Deleted),
                    chat => chat.Id,
                    participant => participant.ChatId,
                    (chat, participant) => chat)
                .FirstOrDefaultAsync();

            if (existingChat != null)
            {
                return await GetChatByIdAsync(existingChat.Id, userId) ?? throw new InvalidOperationException("Failed to get existing chat");
            }
        }

        var chat = new Core.Entities.Chat
        {
            Id = Guid.NewGuid(),
            Type = createDto.Type,
            Title = createDto.Title,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Deleted = false
        };

        _context.Chats.Add(chat);

        var participants = new List<Core.Entities.ChatParticipant>
        {
            new Core.Entities.ChatParticipant
            {
                Id = Guid.NewGuid(),
                ChatId = chat.Id,
                UserId = userId,
                Role = "owner",
                JoinedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Deleted = false
            }
        };

        foreach (var participantId in createDto.ParticipantIds)
        {
            if (participantId == userId)
            {
                continue;
            }

            participants.Add(new Core.Entities.ChatParticipant
            {
                Id = Guid.NewGuid(),
                ChatId = chat.Id,
                UserId = participantId,
                Role = createDto.Type == "group" ? "member" : "member",
                JoinedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Deleted = false
            });
        }

        _context.ChatParticipants.AddRange(participants);
        await _context.SaveChangesAsync();

        return await GetChatByIdAsync(chat.Id, userId) ?? throw new InvalidOperationException("Failed to create chat");
    }

    public async Task<IEnumerable<ChatDto>> GetUserChatsAsync(Guid userId)
    {
        var chatIds = await _context.ChatParticipants
            .Where(cp => cp.UserId == userId && !cp.Deleted && cp.LeftAt == null)
            .Select(cp => cp.ChatId)
            .ToListAsync();

        var chats = await _context.Chats
            .Include(c => c.Creator)
            .Where(c => chatIds.Contains(c.Id) && !c.Deleted)
            .OrderByDescending(c => c.LastMessageAt ?? c.CreatedAt)
            .ToListAsync();

        var result = new List<ChatDto>();

        foreach (var chat in chats)
        {
            var participants = await _context.ChatParticipants
                .Include(cp => cp.User)
                    .ThenInclude(u => u.Profile)
                .Where(cp => cp.ChatId == chat.Id && !cp.Deleted && cp.LeftAt == null)
                .ToListAsync();

            result.Add(new ChatDto
            {
                Id = chat.Id,
                Type = chat.Type,
                Title = chat.Title,
                CreatedBy = chat.CreatedBy ?? Guid.Empty,
                CreatedByUsername = chat.Creator?.Username ?? string.Empty,
                LastMessageAt = chat.LastMessageAt,
                Participants = participants.Select(p => new ChatParticipantDto
                {
                    Id = p.Id,
                    UserId = p.UserId,
                    Username = p.User.Username,
                    AvatarUrl = p.User.Profile?.AvatarUrl,
                    Role = p.Role,
                    JoinedAt = p.JoinedAt
                }).ToList(),
                CreatedAt = chat.CreatedAt,
                UpdatedAt = chat.UpdatedAt
            });
        }

        return result;
    }

    public async Task<ChatDto?> GetChatByIdAsync(Guid chatId, Guid userId)
    {
        var isParticipant = await _context.ChatParticipants
            .AnyAsync(cp => cp.ChatId == chatId 
                && cp.UserId == userId 
                && !cp.Deleted 
                && cp.LeftAt == null);

        if (!isParticipant)
        {
            return null;
        }

        var chat = await _context.Chats
            .Include(c => c.Creator)
            .FirstOrDefaultAsync(c => c.Id == chatId && !c.Deleted);

        if (chat == null)
        {
            return null;
        }

        var participants = await _context.ChatParticipants
            .Include(cp => cp.User)
                .ThenInclude(u => u.Profile)
            .Where(cp => cp.ChatId == chatId && !cp.Deleted && cp.LeftAt == null)
            .ToListAsync();

        return new ChatDto
        {
            Id = chat.Id,
            Type = chat.Type,
            Title = chat.Title,
            CreatedBy = chat.CreatedBy ?? Guid.Empty,
            CreatedByUsername = chat.Creator?.Username ?? string.Empty,
            LastMessageAt = chat.LastMessageAt,
            Participants = participants.Select(p => new ChatParticipantDto
            {
                Id = p.Id,
                UserId = p.UserId,
                Username = p.User.Username,
                AvatarUrl = p.User.Profile?.AvatarUrl,
                Role = p.Role,
                JoinedAt = p.JoinedAt
            }).ToList(),
            CreatedAt = chat.CreatedAt,
            UpdatedAt = chat.UpdatedAt
        };
    }

    public async Task<ChatDto> UpdateChatAsync(Guid chatId, Guid userId, UpdateChatDto updateDto)
    {
        var chat = await _context.Chats
            .FirstOrDefaultAsync(c => c.Id == chatId && !c.Deleted);

        if (chat == null)
        {
            throw new KeyNotFoundException("Chat not found");
        }

        var participant = await _context.ChatParticipants
            .FirstOrDefaultAsync(cp => cp.ChatId == chatId 
                && cp.UserId == userId 
                && !cp.Deleted 
                && cp.LeftAt == null);

        if (participant == null)
        {
            throw new UnauthorizedAccessException("You are not a participant of this chat");
        }

        if (chat.Type == "group" && participant.Role != "owner" && participant.Role != "admin")
        {
            throw new UnauthorizedAccessException("Only owners and admins can update group chats");
        }

        if (updateDto.Title != null)
        {
            chat.Title = updateDto.Title;
        }

        chat.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetChatByIdAsync(chatId, userId) ?? throw new InvalidOperationException("Failed to update chat");
    }

    public async Task AddParticipantAsync(Guid chatId, Guid userId, Guid participantId)
    {
        var chat = await _context.Chats
            .FirstOrDefaultAsync(c => c.Id == chatId && !c.Deleted);

        if (chat == null)
        {
            throw new KeyNotFoundException("Chat not found");
        }

        if (chat.Type == "direct")
        {
            throw new InvalidOperationException("Cannot add participants to direct chat");
        }

        var participant = await _context.ChatParticipants
            .FirstOrDefaultAsync(cp => cp.ChatId == chatId 
                && cp.UserId == userId 
                && !cp.Deleted 
                && cp.LeftAt == null);

        if (participant == null)
        {
            throw new UnauthorizedAccessException("You are not a participant of this chat");
        }

        if (participant.Role != "owner" && participant.Role != "admin")
        {
            throw new UnauthorizedAccessException("Only owners and admins can add participants");
        }

        var existingParticipant = await _context.ChatParticipants
            .FirstOrDefaultAsync(cp => cp.ChatId == chatId 
                && cp.UserId == participantId 
                && !cp.Deleted);

        if (existingParticipant != null)
        {
            if (existingParticipant.LeftAt != null)
            {
                existingParticipant.LeftAt = null;
                existingParticipant.Deleted = false;
                existingParticipant.UpdatedAt = DateTime.UtcNow;
            }
        }
        else
        {
            var newParticipant = new Core.Entities.ChatParticipant
            {
                Id = Guid.NewGuid(),
                ChatId = chatId,
                UserId = participantId,
                Role = "member",
                JoinedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Deleted = false
            };

            _context.ChatParticipants.Add(newParticipant);
        }

        await _context.SaveChangesAsync();
    }

    public async Task RemoveParticipantAsync(Guid chatId, Guid userId, Guid participantId)
    {
        var chat = await _context.Chats
            .FirstOrDefaultAsync(c => c.Id == chatId && !c.Deleted);

        if (chat == null)
        {
            throw new KeyNotFoundException("Chat not found");
        }

        var currentParticipant = await _context.ChatParticipants
            .FirstOrDefaultAsync(cp => cp.ChatId == chatId 
                && cp.UserId == userId 
                && !cp.Deleted 
                && cp.LeftAt == null);

        if (currentParticipant == null)
        {
            throw new UnauthorizedAccessException("You are not a participant of this chat");
        }

        var targetParticipant = await _context.ChatParticipants
            .FirstOrDefaultAsync(cp => cp.ChatId == chatId 
                && cp.UserId == participantId 
                && !cp.Deleted 
                && cp.LeftAt == null);

        if (targetParticipant == null)
        {
            throw new KeyNotFoundException("Participant not found");
        }

        if (userId == participantId)
        {
            targetParticipant.LeftAt = DateTime.UtcNow;
            targetParticipant.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            if (chat.Type == "direct")
            {
                throw new InvalidOperationException("Cannot remove participant from direct chat");
            }

            if (currentParticipant.Role != "owner" && currentParticipant.Role != "admin")
            {
                throw new UnauthorizedAccessException("Only owners and admins can remove participants");
            }

            if (targetParticipant.Role == "owner")
            {
                throw new InvalidOperationException("Cannot remove owner from chat");
            }

            targetParticipant.LeftAt = DateTime.UtcNow;
            targetParticipant.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }
}

