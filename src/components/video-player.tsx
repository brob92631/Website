"use client";

import React from 'react';
import ReactPlayer from 'react-player/lazy';

interface VideoPlayerProps {
  src: string;
}

export const VideoPlayer = ({ src }: VideoPlayerProps) => {
  return (
    <div className='player-wrapper'>
      <ReactPlayer
        className='react-player'
        url={src}
        playing={true}
        controls={true}
        width='100%'
        height='100%'
      />
    </div>
  );
};
