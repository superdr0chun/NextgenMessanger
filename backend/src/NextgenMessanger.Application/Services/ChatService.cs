using Microsoft.EntityFrameworkCore;
using NextgenMessanger.Application.Interfaces;
using NextgenMessanger.Core.DTOs.Chat;
using NextgenMessanger.Core.Enums;
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
        if (createDto.Type == ChatType.Direct)
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
                .Where(c => c.Type == ChatType.Direct && !c.Deleted)
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
                Role = ChatParticipantRole.Owner,
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
                Role = ChatParticipantRole.Member,
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
            .Include(c => c.LastMessage)
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

            // Calculate unread count for current user
            var currentParticipant = participants.FirstOrDefault(p => p.UserId == userId);
            var lastReadAt = currentParticipant?.LastReadAt;
            
            var unreadCount = await _context.ChatMessages
                .Where(m => m.ChatId == chat.Id 
                    && !m.Deleted 
                    && m.SenderId != userId
                    && (lastReadAt == null || m.CreatedAt > lastReadAt))
                .CountAsync();

            result.Add(new ChatDto
            {
                Id = chat.Id,
                Type = chat.Type,
                Title = chat.Title,
                CreatedBy = chat.CreatedBy ?? Guid.Empty,
                CreatedByUsername = chat.Creator?.Username ?? string.Empty,
                LastMessageAt = chat.LastMessageAt,
                LastMessageContent = chat.LastMessage?.Content,
                LastMessageSenderId = chat.LastMessage?.SenderId,
                UnreadCount = unreadCount,
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
            .Include(c => c.LastMessage)
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

        // Calculate unread count for current user
        var currentParticipant = participants.FirstOrDefault(p => p.UserId == userId);
        var lastReadAt = currentParticipant?.LastReadAt;
        
        var unreadCount = await _context.ChatMessages
            .Where(m => m.ChatId == chatId 
                && !m.Deleted 
                && m.SenderId != userId
                && (lastReadAt == null || m.CreatedAt > lastReadAt))
            .CountAsync();

        return new ChatDto
        {
            Id = chat.Id,
            Type = chat.Type,
            Title = chat.Title,
            CreatedBy = chat.CreatedBy ?? Guid.Empty,
            CreatedByUsername = chat.Creator?.Username ?? string.Empty,
            LastMessageAt = chat.LastMessageAt,
            LastMessageContent = chat.LastMessage?.Content,
            LastMessageSenderId = chat.LastMessage?.SenderId,
            UnreadCount = unreadCount,
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

    public async Task MarkChatAsReadAsync(Guid chatId, Guid userId)
    {
        var participant = await _context.ChatParticipants
            .FirstOrDefaultAsync(cp => cp.ChatId == chatId 
                && cp.UserId == userId 
                && !cp.Deleted 
                && cp.LeftAt == null);

        if (participant != null)
        {
            participant.LastReadAt = DateTime.UtcNow;
            participant.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
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

        if (chat.Type == ChatType.Group && participant.Role != ChatParticipantRole.Owner && participant.Role != ChatParticipantRole.Admin)
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

        if (chat.Type == ChatType.Direct)
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

        if (participant.Role != ChatParticipantRole.Owner && participant.Role != ChatParticipantRole.Admin)
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
                Role = ChatParticipantRole.Member,
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
            if (chat.Type == ChatType.Direct)
            {
                throw new InvalidOperationException("Cannot remove participant from direct chat");
            }

            if (currentParticipant.Role != ChatParticipantRole.Owner && currentParticipant.Role != ChatParticipantRole.Admin)
            {
                throw new UnauthorizedAccessException("Only owners and admins can remove participants");
            }

            if (targetParticipant.Role == ChatParticipantRole.Owner)
            {
                throw new InvalidOperationException("Cannot remove owner from chat");
            }

            targetParticipant.LeftAt = DateTime.UtcNow;
            targetParticipant.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task DeleteChatAsync(Guid chatId, Guid userId, bool forEveryone = false)
    {
        var chat = await _context.Chats
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.Id == chatId && !c.Deleted);

        if (chat == null)
        {
            throw new KeyNotFoundException("Chat not found");
        }

        // Check if user is a participant
        var participant = chat.Participants
            .FirstOrDefault(p => p.UserId == userId && !p.Deleted && p.LeftAt == null);

        if (participant == null)
        {
            throw new UnauthorizedAccessException("You are not a participant of this chat");
        }

        if (forEveryone)
        {
            // Delete for everyone
            // For group chats, only owner can delete for everyone
            if (chat.Type == ChatType.Group && participant.Role != ChatParticipantRole.Owner)
            {
                throw new UnauthorizedAccessException("Only owners can delete group chats for everyone");
            }

            // Soft delete the chat
            chat.Deleted = true;
            chat.DeletedAt = DateTime.UtcNow;
            chat.UpdatedAt = DateTime.UtcNow;

            // Mark all participants as left
            foreach (var p in chat.Participants.Where(p => !p.Deleted && p.LeftAt == null))
            {
                p.LeftAt = DateTime.UtcNow;
                p.UpdatedAt = DateTime.UtcNow;
            }
        }
        else
        {
            // Delete only for this user (leave chat)
            participant.LeftAt = DateTime.UtcNow;
            participant.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }
}

