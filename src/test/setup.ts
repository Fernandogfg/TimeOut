import React from 'react'
import '@testing-library/jest-dom'

// Polyfill for React.act for React 19 compatibility
if (!React.act) {
  React.act = async (callback: () => any) => {
    return callback()
  }
}
