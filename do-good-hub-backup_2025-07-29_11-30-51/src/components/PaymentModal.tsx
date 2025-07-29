import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Shield, Banknote } from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: any;
  onPaymentSuccess: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PaymentModal({ open, onOpenChange, transaction, onPaymentSuccess }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay SDK");
      }

      // Create Razorpay order
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: { transaction_id: transaction.id }
        }
      );

      if (orderError) {
        throw new Error(orderError.message);
      }

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create payment order");
      }

      const { razorpay_order } = orderData;

      // Get user profile for payment details
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .single();

      const options = {
        key: 'rzp_test_nCd2hfvHCMCHEt', // Razorpay Key ID
        amount: razorpay_order.amount,
        currency: razorpay_order.currency,
        name: 'NGO Donation Platform',
        description: `Payment for ${transaction.donations?.package_title || 'Donation Package'}`,
        order_id: razorpay_order.id,
        prefill: {
          name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Donor',
          email: profile?.email || '',
          contact: profile?.phone || ''
        },
        theme: {
          color: '#3B82F6'
        },
        handler: async function (response: any) {
          try {
            // Verify payment
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              'verify-razorpay-payment',
              {
                body: {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  transaction_id: transaction.id
                }
              }
            );

            if (verifyError || !verifyData.success) {
              throw new Error(verifyData?.error || verifyError?.message || "Payment verification failed");
            }

            toast.success("Payment completed successfully!");
            onPaymentSuccess();
            onOpenChange(false);
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error(error instanceof Error ? error.message : "Payment verification failed");
          }
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            toast.info("Payment cancelled");
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to initiate payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const amount = transaction?.donations?.total_amount || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Complete Payment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Payment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Package:</span>
                <span className="font-medium">{transaction?.donations?.package_title}</span>
              </div>
              <div className="flex justify-between">
                <span>NGO:</span>
                <span className="font-medium">{transaction?.ngos?.name}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span>₹{amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200">Secure Payment</p>
              <p className="text-blue-600 dark:text-blue-300">
                Your payment is processed securely through Razorpay with 256-bit SSL encryption.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <Banknote className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-800 dark:text-green-200">Pay on Delivery Confirmation</p>
              <p className="text-green-600 dark:text-green-300">
                Payment is only requested after your donation has been successfully delivered to the NGO.
              </p>
            </div>
          </div>

          <Button 
            onClick={handlePayment} 
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? "Initiating Payment..." : `Pay ₹${amount.toLocaleString()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}