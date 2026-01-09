import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Trash2 } from "lucide-react";
import { PurchaseRequisition } from "./pr-list";

interface CreatePRFormProps {
  onSubmit: (pr: Omit<PurchaseRequisition, "id" | "prNumber" | "status" | "date">) => void;
  onCancel: () => void;
}

export function CreatePRForm({ onSubmit, onCancel }: CreatePRFormProps) {
  const [type, setType] = useState<"new_set" | "modification">("new_set");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [department, setDepartment] = useState("");
  const [items, setItems] = useState<{ itemName: string; quantity: number; specifications: string }[]>([
    { itemName: "", quantity: 1, specifications: "" }
  ]);

  const addItem = () => {
    setItems([...items, { itemName: "", quantity: 1, specifications: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      title,
      description,
      requestedBy,
      department,
      items,
      quotations: []
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Create Purchase Requisition</CardTitle>
          <CardDescription>
            Fill in the details for your new PR. All fields are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">PR Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as "new_set" | "modification")}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_set">New Set</SelectItem>
                  <SelectItem value="modification">Modification Set</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NPD">NPD</SelectItem>
                  <SelectItem value="R&D">R&D</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">PR Title</Label>
            <Input
              id="title"
              placeholder="e.g., New Product Line Components"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestedBy">Requested By</Label>
            <Input
              id="requestedBy"
              placeholder="Your name"
              value={requestedBy}
              onChange={(e) => setRequestedBy(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed description of the purchase requisition..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4>Item {index + 1}</h4>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`itemName-${index}`}>Item Name</Label>
                        <Input
                          id={`itemName-${index}`}
                          placeholder="e.g., Circuit Board"
                          value={item.itemName}
                          onChange={(e) => updateItem(index, "itemName", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value))}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`specifications-${index}`}>Specifications</Label>
                      <Textarea
                        id={`specifications-${index}`}
                        placeholder="Technical specifications, requirements, etc."
                        value={item.specifications}
                        onChange={(e) => updateItem(index, "specifications", e.target.value)}
                        rows={3}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Submit PR
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
