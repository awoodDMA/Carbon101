'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface Row {
  id: number
  name: string
  qty: number
  profile: string
}

const initialSystems: Row[] = [
  { id: 1, name: 'External walls', qty: 120, profile: 'Generic' },
  { id: 2, name: 'Roof', qty: 80, profile: 'Generic' },
  { id: 3, name: 'Slab', qty: 60, profile: 'Generic' },
]

const initialProducts: Row[] = [
  { id: 1, name: 'Concrete C30/37', qty: 100, profile: 'EC3' },
  { id: 2, name: 'Steel S355', qty: 45, profile: 'EC3' },
  { id: 3, name: 'Brick', qty: 30, profile: 'EC3' },
]

export default function SystemProductTabs() {
  const [systems, setSystems] = useState(initialSystems)
  const [products, setProducts] = useState(initialProducts)
  const [sysAsc, setSysAsc] = useState(true)
  const [prodAsc, setProdAsc] = useState(true)

  const sortRows = (
    rows: Row[],
    asc: boolean,
    setRows: React.Dispatch<React.SetStateAction<Row[]>>,
    setAsc: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    const next = !asc
    setAsc(next)
    const sorted = [...rows].sort((a, b) =>
      next ? a.qty - b.qty : b.qty - a.qty
    )
    setRows(sorted)
  }

  const updateProfile = (
    setRows: React.Dispatch<React.SetStateAction<Row[]>>,
    index: number,
    value: string
  ) => {
    setRows(rows =>
      rows.map((r, i) => (i === index ? { ...r, profile: value } : r))
    )
  }

  const renderTable = (
    rows: Row[],
    asc: boolean,
    onSort: () => void,
    setRows: React.Dispatch<React.SetStateAction<Row[]>>
  ) => (
    <table className="w-full table-auto text-sm">
      <thead>
        <tr className="border-b">
          <th className="p-2 text-left">Name</th>
          <th className="p-2 text-left cursor-pointer" onClick={onSort}>
            Qty {asc ? '▲' : '▼'}
          </th>
          <th className="p-2 text-left">Carbon</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.id} className="border-b last:border-0">
            <td className="p-2">{row.name}</td>
            <td className="p-2">{row.qty}</td>
            <td className="p-2">
              <select
                value={row.profile}
                onChange={e => updateProfile(setRows, i, e.target.value)}
                className="rounded border p-1"
              >
                <option value="Generic">Generic</option>
                <option value="EC3">EC3</option>
                <option value="ICE">ICE</option>
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <Tabs defaultValue="systems" className="w-full">
      <TabsList>
        <TabsTrigger value="systems">Systems</TabsTrigger>
        <TabsTrigger value="products">Products</TabsTrigger>
      </TabsList>
      <TabsContent value="systems">
        {renderTable(systems, sysAsc, () =>
          sortRows(systems, sysAsc, setSystems, setSysAsc)
        , setSystems)}
      </TabsContent>
      <TabsContent value="products">
        {renderTable(products, prodAsc, () =>
          sortRows(products, prodAsc, setProducts, setProdAsc)
        , setProducts)}
      </TabsContent>
    </Tabs>
  )
}
