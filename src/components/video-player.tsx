"use client";

import React from 'react';
import ReactHlsPlayer from 'react-hls-player';

interface VideoPlayerProps {
  src: string;
}

export const VideoPlayer = ({ src }: VideoPlayerProps) => {
  return (
    <ReactHlsPlayer
      src={src}
      autoPlay={true}
      controls={true}
      width="100%"
      height="auto"
    />
  );
};
