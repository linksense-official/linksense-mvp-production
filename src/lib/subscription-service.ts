// src/lib/subscription-service.ts
import { stripe } from './stripe';

// 型定義の追加（Stripe型に依存しない独自型定義）
interface CheckoutSessionParams {
  priceId: string;
  customerEmail: string;
  customerName: string;
  successUrl: string;
  cancelUrl: string;
}

interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

interface SubscriptionStatusResult {
  subscription: any | null;
  customer: any | null;
}

interface CancelSubscriptionResult {
  success: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string;
}

export class SubscriptionService {
  
  /**
   * 顧客作成または取得
   */
  async getOrCreateCustomer(email: string, name: string): Promise<string> {
    try {
      // 既存顧客検索
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        console.log('✅ Existing customer found:', existingCustomers.data[0].id);
        return existingCustomers.data[0].id;
      }

      // 新規顧客作成
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          source: 'linksense-mvp',
          created_at: new Date().toISOString(),
        },
      });

      console.log('✅ New customer created:', customer.id);
      return customer.id;
    } catch (error) {
      console.error('❌ Customer creation failed:', error);
      throw new Error('Failed to create or retrieve customer');
    }
  }

  /**
   * Checkout Session作成
   */
  async createCheckoutSession({
    priceId,
    customerEmail,
    customerName,
    successUrl,
    cancelUrl,
  }: CheckoutSessionParams): Promise<CheckoutSessionResult> {
    try {
      const customerId = await this.getOrCreateCustomer(customerEmail, customerName);

      console.log('🔄 Creating checkout session for customer:', customerId);

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        automatic_tax: {
          enabled: false,
        },
        metadata: {
          customer_email: customerEmail,
          customer_name: customerName,
          price_id: priceId,
        },
      });

      if (!session.url) {
        throw new Error('Checkout session URL not generated');
      }

      console.log('✅ Checkout session created:', session.id);

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      console.error('❌ Checkout session creation failed:', error);
      throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * サブスクリプション状態取得
   */
  async getSubscriptionStatus(customerEmail: string): Promise<SubscriptionStatusResult> {
    try {
      console.log('🔍 Getting subscription status for:', customerEmail);

      const customers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });

      if (customers.data.length === 0) {
        console.log('ℹ️ No customer found for email:', customerEmail);
        return {
          subscription: null,
          customer: null,
        };
      }

      const customer = customers.data[0];
      console.log('✅ Customer found:', customer.id);

      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 1,
      });

      const subscription = subscriptions.data.length > 0 ? subscriptions.data[0] : null;
      
      if (subscription) {
        console.log('✅ Active subscription found:', subscription.id);
      } else {
        console.log('ℹ️ No active subscription found for customer:', customer.id);
      }

      return {
        subscription,
        customer,
      };
    } catch (error) {
      console.error('❌ Subscription status retrieval failed:', error);
      throw new Error(`Failed to retrieve subscription status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * サブスクリプションキャンセル（期間終了時）
   */
  async cancelSubscription(subscriptionId: string): Promise<CancelSubscriptionResult> {
    try {
      console.log('🔄 Canceling subscription:', subscriptionId);

      // Stripe APIコール（any型で受け取り、安全にアクセス）
      const updatedSubscription: any = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      // 安全なプロパティアクセス
      const cancelAtPeriodEnd = Boolean(updatedSubscription?.cancel_at_period_end);
      
      // current_period_end の安全なアクセス
      let currentPeriodEnd: string;
      if (updatedSubscription?.current_period_end && typeof updatedSubscription.current_period_end === 'number') {
        currentPeriodEnd = new Date(updatedSubscription.current_period_end * 1000).toISOString();
      } else {
        // フォールバック: 30日後
        currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      console.log('✅ Subscription marked for cancellation:', {
        id: updatedSubscription?.id,
        cancelAtPeriodEnd,
        currentPeriodEnd,
      });

      return {
        success: true,
        cancelAtPeriodEnd,
        currentPeriodEnd,
      };
    } catch (error) {
      console.error('❌ Subscription cancellation failed:', error);
      throw new Error(`Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * サブスクリプション即座キャンセル
   */
  async cancelSubscriptionImmediately(subscriptionId: string): Promise<{ success: boolean; canceledAt: string }> {
    try {
      console.log('🔄 Immediately canceling subscription:', subscriptionId);

      const canceledSubscription: any = await stripe.subscriptions.cancel(subscriptionId);
      
      // canceled_at の安全なアクセス
      let canceledAt: string;
      if (canceledSubscription?.canceled_at && typeof canceledSubscription.canceled_at === 'number') {
        canceledAt = new Date(canceledSubscription.canceled_at * 1000).toISOString();
      } else {
        canceledAt = new Date().toISOString();
      }

      console.log('✅ Subscription immediately canceled:', canceledSubscription?.id);

      return {
        success: true,
        canceledAt,
      };
    } catch (error) {
      console.error('❌ Immediate subscription cancellation failed:', error);
      throw new Error(`Failed to immediately cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * サブスクリプション再開
   */
  async resumeSubscription(subscriptionId: string): Promise<{ success: boolean; subscription: any }> {
    try {
      console.log('🔄 Resuming subscription:', subscriptionId);

      const resumedSubscription: any = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      console.log('✅ Subscription resumed:', resumedSubscription?.id);

      return {
        success: true,
        subscription: resumedSubscription,
      };
    } catch (error) {
      console.error('❌ Subscription resume failed:', error);
      throw new Error(`Failed to resume subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 顧客のすべてのサブスクリプション取得
   */
  async getCustomerSubscriptions(customerEmail: string): Promise<any[]> {
    try {
      const customers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });

      if (customers.data.length === 0) {
        return [];
      }

      const customer = customers.data[0];
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 100,
      });

      return subscriptions.data;
    } catch (error) {
      console.error('❌ Customer subscriptions retrieval failed:', error);
      throw new Error(`Failed to retrieve customer subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 請求履歴取得
   */
  async getInvoiceHistory(customerEmail: string): Promise<any[]> {
    try {
      const customers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });

      if (customers.data.length === 0) {
        return [];
      }

      const customer = customers.data[0];
      const invoices = await stripe.invoices.list({
        customer: customer.id,
        limit: 50,
      });

      return invoices.data;
    } catch (error) {
      console.error('❌ Invoice history retrieval failed:', error);
      throw new Error(`Failed to retrieve invoice history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * プラン変更
   */
  async changePlan(subscriptionId: string, newPriceId: string): Promise<{ success: boolean; subscription: any }> {
    try {
      console.log('🔄 Changing plan for subscription:', subscriptionId, 'to price:', newPriceId);

      // 現在のサブスクリプション取得
      const currentSubscription: any = await stripe.subscriptions.retrieve(subscriptionId);
      
      if (!currentSubscription?.items?.data?.[0]) {
        throw new Error('No subscription items found');
      }

      // プラン変更
      const updatedSubscription: any = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: currentSubscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
      });

      console.log('✅ Plan changed successfully:', updatedSubscription?.id);

      return {
        success: true,
        subscription: updatedSubscription,
      };
    } catch (error) {
      console.error('❌ Plan change failed:', error);
      throw new Error(`Failed to change plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * サブスクリプション詳細取得
   */
  async getSubscriptionDetails(subscriptionId: string): Promise<any> {
    try {
      console.log('🔍 Getting subscription details for:', subscriptionId);

      const subscription: any = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice', 'customer', 'items.data.price'],
      });

      console.log('✅ Subscription details retrieved:', subscription?.id);

      return subscription;
    } catch (error) {
      console.error('❌ Subscription details retrieval failed:', error);
      throw new Error(`Failed to retrieve subscription details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// シングルトンインスタンス
export const subscriptionService = new SubscriptionService();