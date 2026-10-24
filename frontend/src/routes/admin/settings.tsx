import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Store,
  Shield,
  Save,
  Check,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/context/settings";
import { useAuth } from "@/context/auth";
import { cleanWhatsAppNumber } from "@/lib/config";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { settings, updateSettings } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state initialized from DB settings
  const [storeName, setStoreName] = useState(settings.storeName);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [officeEmail, setOfficeEmail] = useState(settings.officeEmail);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address || "Colombo, Sri Lanka");
  const [currency, setCurrency] = useState(settings.currency);
  const [taxRate, setTaxRate] = useState(settings.taxRate);

  const [notifications, setNotifications] = useState(settings.notifications);

  // Sync state when settings load from API
  useEffect(() => {
    setStoreName(settings.storeName);
    setWhatsappNumber(settings.whatsappNumber);
    setOfficeEmail(settings.officeEmail);
    setPhone(settings.phone);
    setAddress(settings.address || "Colombo, Sri Lanka");
    setCurrency(settings.currency);
    setTaxRate(settings.taxRate);
    setNotifications(settings.notifications);
  }, [settings]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const success = await updateSettings({
      storeName: storeName.trim(),
      whatsappNumber: whatsappNumber.trim(),
      officeEmail: officeEmail.trim(),
      phone: phone.trim(),
      address: address.trim(),
      currency,
      taxRate,
      notifications,
    });

    setIsSaving(false);
    if (success) {
      setSaved(true);
      toast.success("Business contact & store settings saved to database!");
      setTimeout(() => setSaved(false), 2500);
    } else {
      toast.error("Failed to save settings. Please try again.");
    }
  };

  const cleanWa = cleanWhatsAppNumber(whatsappNumber);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-500/10 via-zinc-900 to-zinc-900 border border-orange-500/20 rounded-xl p-5">
        <h1 className="text-lg font-black text-white">Store & Business Contact Settings</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Configure the official AEC WhatsApp number, official office email, and storefront
          defaults. All changes persist in the database and update the customer storefront
          immediately.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* AEC Official Business Communication Section */}
        <div className="admin-card space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <MessageSquare className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Official AEC Business Communication
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* WhatsApp Field */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="flex items-center justify-between font-bold text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Official AEC WhatsApp Number
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">wa.me/{cleanWa}</span>
              </label>
              <input
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+94 74 106 6017"
                className="admin-input w-full font-mono text-emerald-300 font-bold border-emerald-500/30 focus:border-emerald-500"
              />
              <p className="text-[11px] text-zinc-400">
                Used for the <strong>Request Quotation via WhatsApp</strong> customer flow and
                floating chat button.
              </p>
            </div>

            {/* Office Email Field */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="flex items-center gap-1.5 font-bold text-zinc-300">
                <Mail className="h-3.5 w-3.5 text-orange-400" />
                Official AEC Office Email
              </label>
              <input
                required
                type="email"
                value={officeEmail}
                onChange={(e) => setOfficeEmail(e.target.value)}
                placeholder="aecpvt60@gmail.com"
                className="admin-input w-full font-mono text-orange-300 font-bold border-orange-500/30 focus:border-orange-500"
              />
              <p className="text-[11px] text-zinc-400">
                Official office email displayed across the storefront, contact page, and footer.
              </p>
            </div>
          </div>
        </div>

        {/* Store Profile Settings */}
        <div className="admin-card space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Store className="h-4 w-4 text-orange-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Store Profile Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-zinc-400">Store Name</label>
              <input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="admin-input w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 font-bold text-zinc-400">
                <Phone className="h-3.5 w-3.5 text-zinc-400" />
                Office Voice Hotline
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="admin-input w-full font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 font-bold text-zinc-400">
                <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                Headquarters Address
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Sri Lanka"
                className="admin-input w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 font-bold text-zinc-400">
                <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
                Base Currency Display
              </label>
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="admin-input w-full"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-zinc-500">
            Settings persist in Supabase and local system storage.
          </p>
          <button
            type="submit"
            disabled={isSaving}
            className="admin-btn-primary inline-flex items-center gap-2 text-xs py-2.5 px-6 cursor-pointer font-bold disabled:opacity-50"
          >
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved Changes!" : isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>

      {/* Security: Admin login credentials (separate form) */}
      <AdminCredentialsCard />
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="admin-input w-full pr-9 font-mono"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-orange-400 transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function AdminCredentialsCard() {
  const { user, updateAdminCredentials } = useAuth();
  const [newEmail, setNewEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setNewEmail(user?.email ?? "");
  }, [user?.email]);

  const emailChanged = newEmail.trim().toLowerCase() !== (user?.email ?? "").toLowerCase();
  const passwordChanged = newPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailChanged && !passwordChanged) {
      toast.info("Enter a new email or a new password to update.");
      return;
    }
    if (!currentPassword) {
      toast.error("Enter your current password to confirm changes.");
      return;
    }
    if (passwordChanged && newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (passwordChanged && newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    setIsUpdating(true);
    const ok = await updateAdminCredentials({
      currentPassword,
      newEmail: emailChanged ? newEmail.trim() : undefined,
      newPassword: passwordChanged ? newPassword : undefined,
    });
    setIsUpdating(false);

    if (ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-card space-y-4" autoComplete="off">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-orange-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Security & Admin Login
          </h2>
        </div>
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          Active Session
        </span>
      </div>

      <div className="p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-white">Current Admin Login Email</p>
          <p className="text-[11px] text-orange-300 font-mono mt-0.5">{user?.email}</p>
        </div>
        <Lock className="h-4 w-4 text-zinc-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1.5 sm:col-span-2">
          <label
            htmlFor="admin-new-email"
            className="flex items-center gap-1.5 font-bold text-zinc-300"
          >
            <Mail className="h-3.5 w-3.5 text-orange-400" />
            Admin Login Email
          </label>
          <input
            id="admin-new-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            autoComplete="off"
            className="admin-input w-full font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="admin-new-password"
            className="flex items-center gap-1.5 font-bold text-zinc-300"
          >
            <KeyRound className="h-3.5 w-3.5 text-orange-400" />
            New Password
          </label>
          <PasswordInput
            id="admin-new-password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Leave blank to keep current"
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="admin-confirm-password"
            className="flex items-center gap-1.5 font-bold text-zinc-300"
          >
            <KeyRound className="h-3.5 w-3.5 text-orange-400" />
            Confirm New Password
          </label>
          <PasswordInput
            id="admin-confirm-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter new password"
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label
            htmlFor="admin-current-password"
            className="flex items-center gap-1.5 font-bold text-zinc-300"
          >
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            Current Password{" "}
            <span className="text-zinc-500 font-normal">(required to confirm)</span>
          </label>
          <PasswordInput
            id="admin-current-password"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Your current admin password"
            autoComplete="current-password"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <p className="text-[11px] text-zinc-500">
          Stored securely in Supabase Authentication. Use the new credentials on your next sign-in.
        </p>
        <button
          id="admin-update-credentials"
          type="submit"
          disabled={isUpdating || (!emailChanged && !passwordChanged)}
          className="admin-btn-primary inline-flex items-center gap-2 text-xs py-2.5 px-6 cursor-pointer font-bold disabled:opacity-50"
        >
          <KeyRound className="h-4 w-4" />
          {isUpdating ? "Updating..." : "Update Login"}
        </button>
      </div>
    </form>
  );
}
