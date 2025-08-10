import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileNav } from "@/components/ui/mobile-nav";
import { Header } from "@/components/common/Header";
import { 
  Share2, 
  Copy, 
  Users, 
  TrendingUp, 
  DollarSign,
  Gift,
  ExternalLink,
  Calendar,
  CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type Product = {
  id: string;
  name: string;
  model: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  inStock: boolean;
};

type ReferralTransaction = {
  id: string;
  productName: string;
  customerName: string;
  amount: number;
  commission: number;
  date: string;
  status: "pending" | "confirmed" | "paid";
};

type ReferralStats = {
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  thisMonth: number;
  conversionRate: number;
};

// Mock product data
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Gaming Mechanical Keyboard",
    model: "REXUS MX5",
    price: 899000,
    originalPrice: 1200000,
    image: "/placeholder.svg",
    category: "Keyboard",
    inStock: true,
  },
  {
    id: "2",
    name: "Gaming Mouse",
    model: "REXUS GM7",
    price: 450000,
    originalPrice: 600000,
    image: "/placeholder.svg",
    category: "Mouse",
    inStock: true,
  },
  {
    id: "3",
    name: "Gaming Headset",
    model: "REXUS H3",
    price: 650000,
    image: "/placeholder.svg",
    category: "Headset",
    inStock: true,
  },
  {
    id: "4",
    name: "Gaming Mousepad",
    model: "REXUS P1",
    price: 150000,
    image: "/placeholder.svg",
    category: "Mousepad",
    inStock: false,
  },
];

// Mock referral data
const mockReferralStats: ReferralStats = {
  totalReferrals: 24,
  totalEarnings: 2400000,
  pendingEarnings: 450000,
  thisMonth: 680000,
  conversionRate: 12.5,
};

const mockTransactions: ReferralTransaction[] = [
  {
    id: "REF001",
    productName: "Gaming Mechanical Keyboard REXUS MX5",
    customerName: "John Doe",
    amount: 899000,
    commission: 89900,
    date: "2024-08-08",
    status: "confirmed",
  },
  {
    id: "REF002", 
    productName: "Gaming Mouse REXUS GM7",
    customerName: "Jane Smith",
    amount: 450000,
    commission: 45000,
    date: "2024-08-07",
    status: "paid",
  },
  {
    id: "REF003",
    productName: "Gaming Headset REXUS H3", 
    customerName: "Mike Johnson",
    amount: 650000,
    commission: 65000,
    date: "2024-08-06",
    status: "pending",
  },
];

export default function Referral() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("products");
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);
  const [referralCode] = useState("REF2024USER001"); // Mock user referral code

  const handleTabChange = (tab: string) => {
    switch (tab) {
      case "home":
        navigate("/");
        break;
      case "rewards":
        break;
      case "shop":
        break;
      case "profile":
        break;
    }
  };

  const generateReferralUrl = (productId: string) => {
    return `${window.location.origin}/product/${productId}?ref=${referralCode}`;
  };

  const copyReferralLink = async (productId: string) => {
    const url = generateReferralUrl(productId);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedProductId(productId);
      setTimeout(() => setCopiedProductId(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case "paid":
        return <Badge className="bg-blue-100 text-blue-800">Paid</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const renderProductsTab = () => (
    <div className="space-y-4">
      <div className="text-center p-4">
        <Gift className="h-12 w-12 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-semibold mb-2">Share & Earn</h2>
        <p className="text-muted-foreground text-sm">
          Share products with your referral code and earn 10% commission on every sale!
        </p>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Users className="h-5 w-5 text-primary" />
          <span className="font-medium">Your Referral Code</span>
        </div>
        <div className="flex gap-2">
          <Input value={referralCode} readOnly className="font-mono" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyReferralLink("")}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <div className="grid gap-4">
        {mockProducts.map((product) => (
          <Card key={product.id} className="p-4 overflow-hidden">
            <div className="flex gap-3">
              <img
                src={product.image}
                alt={product.name}
                className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg bg-muted flex-shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <h3 className="font-medium truncate text-sm sm:text-base">{product.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{product.model}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-primary text-sm">
                      {formatCurrency(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatCurrency(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <Badge variant={product.inStock ? "default" : "secondary"} className="w-fit">
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Commission: {formatCurrency(product.price * 0.1)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  onClick={() => copyReferralLink(product.id)}
                  disabled={!product.inStock}
                  className="text-xs px-2 py-1"
                >
                  {copiedProductId === product.id ? (
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  ) : (
                    <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  )}
                  <span className="hidden sm:inline">
                    {copiedProductId === product.id ? "Copied!" : "Share"}
                  </span>
                  <span className="sm:hidden">
                    {copiedProductId === product.id ? "✓" : "Share"}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(generateReferralUrl(product.id), "_blank")}
                  disabled={!product.inStock}
                  className="text-xs px-2 py-1"
                >
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">View</span>
                  <span className="sm:hidden">View</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Referrals</p>
              <p className="text-2xl font-bold">{mockReferralStats.totalReferrals}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversion</p>
              <p className="text-2xl font-bold">{mockReferralStats.conversionRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="h-5 w-5 text-primary" />
            <span className="font-medium">Total Earnings</span>
          </div>
          <p className="text-3xl font-bold text-primary">
            {formatCurrency(mockReferralStats.totalEarnings)}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="h-5 w-5 text-orange-500" />
            <span className="font-medium">This Month</span>
          </div>
          <p className="text-2xl font-bold text-orange-500">
            {formatCurrency(mockReferralStats.thisMonth)}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="h-5 w-5 text-yellow-500" />
            <span className="font-medium">Pending Earnings</span>
          </div>
          <p className="text-2xl font-bold text-yellow-500">
            {formatCurrency(mockReferralStats.pendingEarnings)}
          </p>
        </Card>
      </div>
    </div>
  );

  const renderTransactionsTab = () => (
    <div className="space-y-4">
      <div className="text-center p-4">
        <h2 className="text-xl font-semibold mb-2">Referral Transactions</h2>
        <p className="text-muted-foreground text-sm">
          Track your referral sales and commission earnings
        </p>
      </div>

      {mockTransactions.map((transaction) => (
        <Card key={transaction.id} className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{transaction.productName}</h3>
                <p className="text-sm text-muted-foreground">Customer: {transaction.customerName}</p>
                <p className="text-xs text-muted-foreground">ID: {transaction.id}</p>
              </div>
              {getStatusBadge(transaction.status)}
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Sale Amount</p>
                <p className="font-semibold">{formatCurrency(transaction.amount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Commission</p>
                <p className="font-semibold text-primary">{formatCurrency(transaction.commission)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-semibold">{new Date(transaction.date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Referral Program" />
      <div className="container max-w-2xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            {renderProductsTab()}
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            {renderAnalyticsTab()}
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            {renderTransactionsTab()}
          </TabsContent>
        </Tabs>
      </div>
      <MobileNav activeTab="rewards" onTabChange={handleTabChange} />
    </div>
  );
}
