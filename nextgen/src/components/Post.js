// src/components/Post.js
import React from 'react';

const Post = ({ author, content, image, likes, comments }) => {
  return (
    <div className="post">
      <div className="post-header">
        <div className="author-avatar">👤</div>
        <div className="author-info">
          <strong>{author}</strong>
          <span>24ч</span>
        </div>
      </div>
      <div className="post-content">
        <p>{content}</p>
        {image && <img src={image} alt="Пост" />}
      </div>
      <div className="post-actions">
        <button>❤️ {likes}</button>
        <button>💬 {comments}</button>
        <button>➡️</button>
      </div>
    </div>
  );
};

export default Post;