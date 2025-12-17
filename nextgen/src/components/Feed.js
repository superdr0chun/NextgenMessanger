// src/components/Feed.js
import React from 'react';
import Post from './Post';

const Feed = () => {
  const posts = [
    {
      author: 'Jonathan Doe',
      content: 'Это удивительная фотография красивого ночного пейзажа. Настоящее чудо!',
      image: 'https://picsum.photos/600/400?random=1',
      likes: '2.4K',
      comments: '821',
    },
    {
      author: 'Jonathan Doe',
      content: 'Еще одна потрясающая сцена звездного неба над горами.',
      image: 'https://picsum.photos/600/400?random=2',
      likes: '2.4K',
      comments: '821',
    },
  ];

  return (
    <div className="feed">
      <div className="feed-header">
        <h2>Главная</h2>
        <div className="tabs">
          <button>Главная</button>
          <button>Популярное</button>
          <button>Музыка</button>
          <button>Фотографии</button>
        </div>
      </div>
      {posts.map((post, index) => (
        <Post key={index} {...post} />
      ))}
    </div>
  );
};

export default Feed;