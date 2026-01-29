/**
 * ProviderConfig Component
 *
 * Allows users to configure AI provider settings including:
 * - Provider selection (Claude, Gemini, OpenAI, Codex)
 * - API key input
 * - Model selection
 * - Save configuration
 */

"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type AIProvider = "claude" | "gemini" | "openai" | "codex"

export interface ProviderConfig {
  provider: AIProvider
  apiKey: string
  model: string
}

interface ProviderConfigProps {
  onSave?: (config: ProviderConfig) => void
  initialConfig?: Partial<ProviderConfig>
  className?: string
}

const providerModels: Record<AIProvider, string[]> = {
  claude: ["claude-3-5-sonnet", "claude-3-opus", "claude-3-haiku"],
  gemini: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
  openai: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
  codex: ["codex-003", "codex-002"],
}

export function ProviderConfig({
  onSave,
  initialConfig,
  className,
}: ProviderConfigProps) {
  const [provider, setProvider] = React.useState<AIProvider>(
    initialConfig?.provider || "claude"
  )
  const [apiKey, setApiKey] = React.useState(initialConfig?.apiKey || "")
  const [model, setModel] = React.useState(initialConfig?.model || "claude-3-5-sonnet")

  // Update model when provider changes
  React.useEffect(() => {
    const models = providerModels[provider]
    if (models.length > 0 && !models.includes(model)) {
      setModel(models[0])
    }
  }, [provider, model])

  const handleSave = () => {
    onSave?.({ provider, apiKey, model })
  }

  const currentModels = providerModels[provider]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>AI Provider Configuration</CardTitle>
        <CardDescription>
          Configure your AI provider settings to enable agent functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Provider Selection */}
        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <Select
            value={provider}
            onValueChange={(value) => setProvider(value as AIProvider)}
          >
            <SelectTrigger id="provider">
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude">Claude (Anthropic)</SelectItem>
              <SelectItem value="gemini">Gemini (Google)</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="codex">Codex</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* API Key Input */}
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="Enter your API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off"
          />
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger id="model">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {currentModels.map((modelOption) => (
                <SelectItem key={modelOption} value={modelOption}>
                  {modelOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <Button onClick={handleSave} className="w-full" disabled={!apiKey}>
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
