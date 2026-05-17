import React from 'react'
import './Watermark.css'

/**
 * Static Maskan logo watermark positioned in the middle of the screen
 * Stays fixed while scrolling and appears behind other content
 * Features flicker and shine animation effects
 */
export default function Watermark() {
  const logoPath = 'M1124.07,46.9C1037.1,16.52,943.78,0,846.79,0,381.05,0,0,381.05,0,846.78v2960.97c0,465.74,381.05,846.79,846.79,846.79s846.79-381.05,846.79-846.79v-990.99c-329.04-87.01-594.49-323.02-722.95-636.9,23.9,140.28,77.12,270.65,153.45,384.36v1243.53c0,152.5-124.77,277.28-277.28,277.28s-277.28-124.77-277.28-277.28V846.78c0-152.5,124.77-277.28,277.28-277.28s276.46,123.96,277.28,275.78c0,.5,0,1,0,1.5v926.84c1.13,367.62,239.65,682.06,569.51,797.27,86.97,30.37,180.29,46.9,277.28,46.9s190.31-16.52,277.28-46.9c329.86-115.21,568.38-429.65,569.51-797.27v-926.84c0-.5,0-1,0-1.5.81-151.82,125.27-275.78,277.27-275.78s277.28,124.77,277.28,277.28v2960.97c0,152.5-124.77,277.28-277.28,277.28s-277.28-124.77-277.28-277.28v-1243.53c76.33-113.71,129.55-244.08,153.45-384.36-128.47,313.88-393.92,549.89-722.95,636.9v990.99c0,465.74,381.05,846.79,846.78,846.79s846.79-381.05,846.79-846.79V846.78C3941.71,381.05,3560.66,0,3094.92,0c-96.99,0-190.31,16.52-277.28,46.9-330.65,115.48-569.51,431.14-569.51,799.88v924.22c0,152.5-124.77,277.28-277.28,277.28s-277.28-124.77-277.28-277.28v-924.22c0-368.74-238.87-684.4-569.51-799.88'

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none -z-10">
      <div className="watermark-animated">
        <svg
          viewBox="0 0 3941.71 4654.54"
          className="w-96 h-96"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="watermark-gradient" x1="0" y1="2327.27" x2="3941.71" y2="2327.27" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#cbad8d" />
              <stop offset="1" stopColor="#dfcfbf" />
            </linearGradient>
            <linearGradient id="shine-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          <path d={logoPath} fill="url(#watermark-gradient)" className="watermark-flicker" />
          <path d={logoPath} fill="url(#shine-gradient)" className="watermark-shine" opacity="0" />
        </svg>
      </div>
    </div>
  )
}
