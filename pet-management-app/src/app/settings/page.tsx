import { Settings, User, Bell, Shield, Palette, Database, Crown, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/AuthGuard'

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            Manage your account preferences and application settings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              <button className="w-full text-left px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5" />
                  <span>Notifications</span>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <div className="flex items-center space-x-3">
                  <Palette className="h-5 w-5" />
                  <span>Appearance</span>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5" />
                  <span>Privacy</span>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <div className="flex items-center space-x-3">
                  <Crown className="h-5 w-5" />
                  <span>Subscription</span>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <div className="flex items-center space-x-3">
                  <Database className="h-5 w-5" />
                  <span>Data & Export</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            <div className="card p-6">
              <div className="flex items-center space-x-3 mb-6">
                <User className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Profile Settings</h2>
              </div>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      defaultValue="John Doe"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      defaultValue="john@example.com"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-foreground mb-2">
                      Timezone
                    </label>
                    <select
                      id="timezone"
                      name="timezone"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save Changes</Button>
                </div>
              </form>
            </div>

            {/* Notification Preferences */}
            <div className="card p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Bell className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Notification Preferences</h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Appointment Reminders</h3>
                    <p className="text-sm text-muted-foreground">Get reminded about upcoming appointments</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Medication Reminders</h3>
                    <p className="text-sm text-muted-foreground">Reminders for pet medications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Weekly Reports</h3>
                    <p className="text-sm text-muted-foreground">Summary of your pets' activities</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Feature Management */}
            <div className="card p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Settings className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Feature Preferences</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Expense Tracking</h3>
                    <p className="text-sm text-muted-foreground">Track and categorize pet expenses</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Document Storage</h3>
                    <p className="text-sm text-muted-foreground">Store and organize pet documents</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Health Tracking</h3>
                    <p className="text-sm text-muted-foreground">Monitor health records and vaccinations</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Some features may require admin approval to enable. Contact your administrator for advanced features.
                </p>
              </div>
            </div>

            {/* Subscription Settings */}
            <div className="card p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Crown className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Subscription & Premium Features</h2>
              </div>

              <div className="space-y-6">
                {/* Current Plan */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-900">Current Plan: Free</h3>
                      <p className="text-sm text-blue-700">Basic pet management features included</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-900">$0</p>
                      <p className="text-sm text-blue-700">per month</p>
                    </div>
                  </div>
                </div>

                {/* Premium Features */}
                <div>
                  <h4 className="font-medium text-foreground mb-3">Upgrade to Premium</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Crown className="h-4 w-4 text-purple-500" />
                        <h5 className="font-medium">Unlimited AI Consultations</h5>
                      </div>
                      <p className="text-sm text-muted-foreground">Get unlimited AI veterinary consultations for all your pets</p>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CreditCard className="h-4 w-4 text-green-500" />
                        <h5 className="font-medium">Advanced Analytics</h5>
                      </div>
                      <p className="text-sm text-muted-foreground">Detailed health reports and expense analytics</p>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Bell className="h-4 w-4 text-blue-500" />
                        <h5 className="font-medium">Priority Support</h5>
                      </div>
                      <p className="text-sm text-muted-foreground">Get priority customer support and faster response times</p>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Database className="h-4 w-4 text-orange-500" />
                        <h5 className="font-medium">Cloud Storage</h5>
                      </div>
                      <p className="text-sm text-muted-foreground">Unlimited document storage and backup</p>
                    </div>
                  </div>
                </div>

                {/* Upgrade Button */}
                <div className="text-center pt-4">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Premium - $9.99/month
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cancel anytime. No long-term commitments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}