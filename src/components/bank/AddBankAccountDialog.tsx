import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAddBankAccount } from '@/hooks/useBankAccounts';
import { toast } from 'sonner';

interface AddBankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddBankAccountDialog({ open, onOpenChange }: AddBankAccountDialogProps) {
  const { isRTL } = useApp();
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [iban, setIban] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  
  const addMutation = useAddBankAccount();

  const handleSubmit = async () => {
    if (!bankName.trim() || !accountHolderName.trim() || !iban.trim()) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }

    try {
      await addMutation.mutateAsync({
        bank_name: bankName.trim(),
        account_holder_name: accountHolderName.trim(),
        iban: iban.trim(),
        is_default: isDefault,
      });
      
      toast.success(isRTL ? 'تمت إضافة الحساب!' : 'Account added!');
      onOpenChange(false);
      setBankName('');
      setAccountHolderName('');
      setIban('');
      setIsDefault(false);
    } catch (error: any) {
      toast.error(isRTL ? 'فشل إضافة الحساب' : 'Failed to add account');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRTL ? 'إضافة حساب بنكي' : 'Add Bank Account'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bankName">
              {isRTL ? 'اسم البنك' : 'Bank Name'}
            </Label>
            <Input
              id="bankName"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder={isRTL ? 'مثال: بنك الراجحي' : 'e.g., Al Rajhi Bank'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountHolderName">
              {isRTL ? 'اسم صاحب الحساب' : 'Account Holder Name'}
            </Label>
            <Input
              id="accountHolderName"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              placeholder={isRTL ? 'الاسم كما هو في البنك' : 'Name as it appears on account'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="iban">
              {isRTL ? 'رقم الآيبان' : 'IBAN'}
            </Label>
            <Input
              id="iban"
              value={iban}
              onChange={(e) => setIban(e.target.value.toUpperCase())}
              placeholder="SA..."
              dir="ltr"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="isDefault">
              {isRTL ? 'تعيين كحساب افتراضي' : 'Set as default account'}
            </Label>
            <Switch
              id="isDefault"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={addMutation.isPending}
            className="w-full"
          >
            {addMutation.isPending
              ? (isRTL ? 'جاري الإضافة...' : 'Adding...')
              : (isRTL ? 'إضافة الحساب' : 'Add Account')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
