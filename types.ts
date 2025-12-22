import React from 'react';

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  content: string;
  image?: string;
}

export interface NavItem {
  label: string;
  href: string;
}