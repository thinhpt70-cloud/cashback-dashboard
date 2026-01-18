import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { TagsInputField } from './tag-input';
import '@testing-library/jest-dom';

// Wrapper component
const TestWrapper = ({ suggestions }) => {
  const methods = useForm({
    defaultValues: {
      tags: [],
    },
  });

  return (
    <FormProvider {...methods}>
      <form>
        <TagsInputField
          name="tags"
          label="Tags"
          suggestions={suggestions}
        />
      </form>
    </FormProvider>
  );
};

describe('TagsInputField Keyboard Navigation', () => {
  const suggestions = ['Apple', 'Banana', 'Cherry'];

  test('navigates suggestions with arrow keys and selects with Enter', async () => {
    render(<TestWrapper suggestions={suggestions} />);

    const input = screen.getByRole('combobox');

    // Type to show suggestions
    fireEvent.change(input, { target: { value: 'a' } }); // Matches Apple, Banana

    // Suggestions should be visible
    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2); // Apple, Banana

    // Press ArrowDown -> Select first ('Apple')
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id);

    // Press ArrowDown -> Select second ('Banana')
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');

    // Press ArrowUp -> Select first ('Apple')
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    // Press Enter -> Add tag
    fireEvent.keyDown(input, { key: 'Enter' });

    // Tag should be added - verify by looking for the remove button
    expect(screen.getByLabelText('Remove Apple')).toBeInTheDocument();

    // Input should be cleared
    expect(input).toHaveValue('');
  });
});
