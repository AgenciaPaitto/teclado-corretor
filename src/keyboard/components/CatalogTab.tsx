import React from 'react';
import type { ProductFolder } from '../../types';
import { ProductsTab } from './ProductsTab';

interface Props {
  condominiums?: ProductFolder[];
  folders?: ProductFolder[];
  onInsert: (text: string) => void;
}

/**
 * Backward compatibility wrapper para ProductsTab.
 */
export function CatalogTab({ condominiums, folders, onInsert }: Props) {
  return <ProductsTab folders={folders || condominiums || []} onInsert={onInsert} />;
}
