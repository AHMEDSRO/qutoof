import { mockProductRepository } from './repositories/mock/mock-product-repository';
import { mockCategoryRepository } from './repositories/mock/mock-category-repository';
import { mockOrderRepository } from './repositories/mock/mock-order-repository';
import { mockUserRepository } from './repositories/mock/mock-user-repository';
import { mockDeliveryRepository } from './repositories/mock/mock-delivery-repository';
import { supabaseProductRepository } from './repositories/supabase/supabase-product-repository';
import { supabaseCategoryRepository } from './repositories/supabase/supabase-category-repository';
import { supabaseOrderRepository } from './repositories/supabase/supabase-order-repository';
import { supabaseUserRepository } from './repositories/supabase/supabase-user-repository';
import { supabaseDeliveryRepository } from './repositories/supabase/supabase-delivery-repository';

const useSupabase = process.env.DATA_SOURCE === 'supabase';

export const productRepository = useSupabase ? supabaseProductRepository : mockProductRepository;
export const categoryRepository = useSupabase ? supabaseCategoryRepository : mockCategoryRepository;
export const orderRepository = useSupabase ? supabaseOrderRepository : mockOrderRepository;
export const userRepository = useSupabase ? supabaseUserRepository : mockUserRepository;
export const deliveryRepository = useSupabase ? supabaseDeliveryRepository : mockDeliveryRepository;
