'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface PricingCardProps {
  title: string;
  description: string;
  price: string;
  features: string[];
  cta?: string;
  onSelect?: () => Promise<void> | void;
  loadingText?: string;
}

export function PricingCard({ title, description, price, features, cta = 'Escolher plano', onSelect, loadingText = 'Processando...' }: PricingCardProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!onSelect) return;
    setLoading(true);
    try {
      await onSelect();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-2xl font-semibold">{price}</div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button onClick={handleClick} className="w-full" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {loadingText}
            </span>
          ) : (
            cta
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
